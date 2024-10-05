const Cart = require('../services');
const helper = require("../helper");
const validation = require("../input-validation");
const { default: mongoose } = require('mongoose');

const cartList = async (req) => {
    let query = { status: "process", deviceId: req.deviceId, cartType: "temp" };

    if (req.isLogin) {
        query = { status: "process", user: req.user._id, cartType: "default" };
    }

    const cart = await Cart.cartList(query);
    if (cart.length)
        await Cart.updateLatestPricing(cart);
    return cart;
}

module.exports = {
    count: async (req, res) => {
        try {
            let query = { deviceId: req.deviceId, cartType: "temp" };
            if (req.isLogin) {
                query = { user: new mongoose.Types.ObjectId(req.user._id), cartType: "default" };
            }
            let items = await Cart.cartCount(query);
            return res.success({ count: items });
        } catch (error) {
            console.error(error)
            res.error(error)
        }
    },
    list: async (req, res) => {
        try {
            let items = await cartList(req);

            return res.success(items);

        } catch (error) {
            console.error(error)
            res.error(error)
        }
    },
    addcartData: async (req, res) => {
        try {
            let data = req.body;


            let getProduct = await Cart.getProduct({ _id: data.product, status: "active" });
            if (!getProduct) {
                return res.error("PRODUCT_IS_INVALID");
            };

            let lineData = await validation.generateLineItems(getProduct, data.items);
            data.items = lineData.items;

            if (req.isLogin) {
                data.user = req.user._id;
            }
            else {
                data.cartType = "temp";
            }
            data.deviceId = req.deviceId;
            data.product = getProduct._id;
            data.subTotal = lineData.itemTotal;
            // data.productName = getProduct.name;
            // data.productImage = getProduct.featured_image?.link;
            let existingCartQuery = {};
            if (req.isLogin) {
                existingCartQuery = { product: data.product, user: data.user, cartType: 'default' };
            }
            else {
                existingCartQuery = { product: data.product, deviceId: req.deviceId, cartType: 'temp' };
            }
            let getExistanceCart = await Cart.getExistanceCart(existingCartQuery);

            let result = {};
            if (getExistanceCart) {
                let updatedItems = validation.addInExistanceCart(getProduct, getExistanceCart.items, data.items);
                result = await Cart.updateCart({ _id: getExistanceCart._id }, updatedItems);
            } else {
                result = await Cart.addToCart(data);
            };

            res.success(result);

        } catch (error) {
            console.error(error);
            res.error(error)
        }
    },
    updateCart: async (req, res) => {
        try {
            let data = req.body;
            let { _id } = req.params;

            let query = { _id, deviceId: req.deviceId, cartType: "temp" };

            if (req.isLogin) {
                query = { _id, user: req.user._id, cartType: "default" };
            }

            let getCart = await Cart.findOne(query);
            if (!getCart) {
                return res.error("INVALID_CART_ID");
            };

            await Cart.updateLatestPricing(getCart);

            let { items, itemTotal } = await validation.updateCartItems(getCart.items, data.items, getCart.product, data.operateType);
            if (items.length) {
                let updated = await Cart.updateCart(query, { items, subTotal: itemTotal });
                let cartItems = await cartList(req);
                return res.success("CART_UPDATED_SUCCESS", cartItems.map((c) => {
                    if (c._id.toString() === updated._id.toString()) {
                        return { ...c, items };
                    }
                    return c;
                }));
            }

            await Cart.removeCart(query);
            return res.success("CART_UPDATED_SUCCESS", await cartList(req));

        } catch (error) {
            res.error(error);
        }
    },
    remove: async (req, res) => {
        try {
            let { _id } = req.params;

            let query = { _id, deviceId: req.deviceId, cartType: "temp" };
            if (req.isLogin) {
                query = { _id, user: req.user._id };
            }

            let item = await Cart.findOne(query);

            if (!item) {
                return res.error("INVALID_CART_ID");
            };

            await Cart.removeCart(query);

            return res.success("CART_DELETED");

        } catch (error) {
            res.error(error);
        }
    },
};

