const Cart = require('../services/cart');
const Order = require('../services/order');
const validation = require("../input-validation");
const Pricing = require("../helper/pricing");
const Coupon = require('../../../models/couponTable');
const helper = require("../helper");
const { getDate } = require('../../../utils');
module.exports = {

    checkoutCalculationMiddleware: async (req, isOrder = false) => {
        let user = req.user;

        let data = req.body;
        data.user = user?._id;
        let query = { _id: data.cart_ids, deviceId: req.deviceId, cartType: "temp" };
        if (user?._id) {
            query = { _id: data.cart_ids, user: user._id, cartType: "default" };
        }

        let cartList = await Cart.cartList(query);

        if (!cartList?.length) {
            throw "CART_IDS_INVALID";
        }

        // Address
        const deliveryFeeCalculation = await Pricing.deliveryFeeCalculation(data);
        if (deliveryFeeCalculation.error && isOrder) {
            throw deliveryFeeCalculation.message;
        };

        data.deliveryFee = deliveryFeeCalculation?.deliveryFee;
        data.shippingDetails = deliveryFeeCalculation?.shippingDetails;
        data.billingDetails = deliveryFeeCalculation?.billingDetails;

        await Cart.updateLatestPricing(cartList);
        let line_items = await validation.generateLineItemsForCheckOut(cartList, deliveryFeeCalculation, isOrder);
        data.totalItems = line_items.totalItems;
        data.subTotal = line_items.subTotal;
        data.line_items = line_items.line_items;
        data.orderTotal = line_items.subTotal;
        data.discountTotal = 0;


        // Apply coupon discount if available
        if (data.coupon) {
            const getCoupon = await Coupon.getCoupon(data.coupon);
            if (!getCoupon) {
                if (isOrder) {
                    throw "INVALID_PROMO_CODE";
                }

                data.couponError = "Promo code is not valid.";
                data.coupon = "";
            } else {
                const minPurchase = getCoupon.amount * 2;
                if (data.subTotal < minPurchase) {
                    data.couponError = "This coupon can be applied on a minimum purchase of $" + minPurchase + ".";
                    data.coupon = "";
                    if (isOrder) {
                        throw data.couponError;
                    }
                }
                else {
                    let couponCost = await validation.applyPromoOnLineItems(data.line_items, getCoupon, data.subTotal, isOrder);
                    if (couponCost?.error) {
                        data.couponError = couponCost.error;
                        data.coupon = "";
                    }
                    else {
                        data.couponType = getCoupon.type;
                        data.couponBy = getCoupon.discount_type;
                        data.couponAmount = getCoupon.amount;
                        data.couponError = couponCost.error;
                        data.discountTotal = couponCost.discountTotal;
                        // data.subTotal = couponCost.subTotal;
                        data.line_items = couponCost.line_items;
                    }

                }
            }
        };

        //calculate tax
        const getTax = Pricing.taxCalculation(env.taxSettings, 0, data.subTotal);
        data.tax = getTax.tax;
        data.taxAmount = getTax.taxAmount;
        data.orderTotal = helper.toFixedNumber((data.subTotal + data.deliveryFee + data.tax) - data.discountTotal);

        return data;
    },

    list: async (req, res) => {
        try {
            const user = req.user;

            const query = { status: { $ne: 'archived' }, user: user._id };

            const orders = await Order.list(query, req.paginationOptions);
            let total = await Order.countData(query);

            return res.success(req.nextPageOptions(orders, total));

        } catch (error) {
            console.error(error)
            res.error(error);
        }
    },

    view: async (req, res) => {
        try {
            const user = req.user;
            const { _id } = req.params;

            const order = await Order.orderById(_id);
            if (!order) {
                return res.error("INVALID_ORDER_ID");
            }

            return res.success("RECORD_FOUND", order);

        } catch (error) {
            console.error(error)
            res.error(error);
        }
    },

    checkout: async (req, res) => {
        try {
            const checkout = await module.exports.checkoutCalculationMiddleware(req);
            return res.success(checkout);

        } catch (error) {
            console.error(error)
            res.error(error)
        }
    },

    createOrder: async (req, res) => {
        try {
            const user = req.user;
            const { paymentMethod = "cod", cart_ids } = req.body;

            const checkout = await module.exports.checkoutCalculationMiddleware(req, true);

            let orders = [];
            const { date, utcDate } = getDate();
            for (const cartItem of checkout.line_items) {
                orders.push({
                    user: user._id,
                    vendor: cartItem.vendor?._id,
                    line_items: cartItem.items,
                    subTotal: cartItem.subTotal,
                    orderTotal: helper.toFixedNumber((cartItem.subTotal + cartItem.deliveryFee + cartItem.tax) - cartItem.discountTotal),
                    discountTotal: cartItem.discountTotal,
                    deliveryFee: cartItem.deliveryFee,
                    shippingDetails: checkout.shippingDetails,
                    billingDetails: checkout.billingDetails,
                    tax: cartItem.tax,
                    taxAmount: cartItem.taxAmount,
                    paymentMethod: paymentMethod,
                    status: "pending",
                    customOrderId: helper.generateOrderID(),
                    coupon: checkout.coupon,
                    couponType: checkout.couponType,
                    couponBy: checkout.couponBy,
                    couponAmount: checkout.couponAmount,

                    date_created: date,
                    date_created_utc: utcDate,
                    date_customer_confirmed_utc: utcDate,
                    date_modified: date,
                    date_modified_utc: utcDate,
                });
            }

            if (orders.length) {
                await Order.createMany(orders);
                // Clear the cart for the processed order
                await Cart.clearCartByIds(cart_ids);

                try {
                    Order.sendOrderEmails({ user, orders });
                    Order.updateProductStocks(orders);
                }
                catch (err) { console.log(err); }

                return res.success("ORDER_SUCCESS", orders);
            }

            return res.error("SOMETHING_WENT_WRONG");

        } catch (error) {
            console.error(error)
            res.error(error);
        }
    },
};
