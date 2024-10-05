const express = require('express');
const router = express.Router();
const controller = require('./controllers');
const { authentication, setPagination, commonAuthentication } = require("../../middleware");
const { checkout, placeOrder } = require("./validators")

/**
 * Order APIs
 */

router.post('/checkout', commonAuthentication, checkout, controller.checkout);
router.post('/add', authentication, placeOrder, controller.createOrder);
router.get('/list', authentication, setPagination, controller.list);
router.get('/view/:_id', authentication, controller.view);




module.exports = router;