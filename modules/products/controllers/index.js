const Product = require('../services');
const { processVariations } = require("../../../utils");
module.exports = {
    topRankingProducts: async (req, res) => {
        try {

            let query = { status: "active", };//isFeatured: true

            let items = await Product.getTopRankingProducts(query, req.paginationOptions);
            let total = await Product.countData(query);

            return res.success(req.nextPageOptions(items, total));

        } catch (error) {
            console.error(error)
            res.error(error)
        }
    },
    newArrivalProducts: async (req, res) => {
        try {

            let query = { status: "active" };

            let items = await Product.getNewArrivalsProducts(query, req.paginationOptions);
            let total = await Product.countData(query);

            return res.success(req.nextPageOptions(items, total));

        } catch (error) {
            res.error(error)
        }
    },
    getSavingsSpotlight: async (req, res) => {
        try {

            let query = { status: "active" };

            let items = await Product.getSavingsSpotlight(query, req.paginationOptions);
            let total = await Product.countData(query);

            return res.success(req.nextPageOptions(items, total));

        } catch (error) {
            res.error(error)
        }
    },
    view: async (req, res) => {
        try {
            let { _id } = req.params;
            let query = { _id, status: "active" };

            let item = await Product.view(query);

            if (!item) {
                return res.error("INVALID_PRODUCT_ID");
            };

            item = processVariations(item);

            return res.success(item);

        } catch (error) {
            console.log(error)
            res.error(error)
        }
    },
    adminSellerProducts: async (req, res) => {
        try {

            let query = { status: "active", adminSold: true };
            let { category } = req.query;

            if (category) {
                query.categories = category;
            } else {
                query.isFeatured = true;
            };

            let items = await Product.list(query, req.paginationOptions);
            let total = await Product.countData(query);

            return res.success(req.nextPageOptions(items, total));

        } catch (error) {
            console.error(error)
            res.error(error)
        }
    },
    list: async (req, res) => {
        try {

            let query = { status: "active" };
            let { category, fieldName, fieldValue } = req.query;

            if (category) {
                query.categories = category;
            }

            if (fieldName && fieldValue) {
                query[fieldName] = fieldValue;
            }

            let items = await Product.list(query, req.paginationOptions);
            let total = await Product.countData(query);

            return res.success(req.nextPageOptions(items, total));

        } catch (error) {
            console.error(error)
            res.error(error)
        }
    }
};

