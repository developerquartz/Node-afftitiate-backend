const express = require('express');
const router = express.Router();
const controller = require('./controllers');
const { authorization, setPagination } = require("../../middleware");
const { authentication } = require('../../middleware');

router.get('/top-ranking', setPagination, controller.topRankingProducts);
router.get('/new-arrivals', setPagination, controller.newArrivalProducts);
router.get('/savings-spotlight', setPagination, controller.getSavingsSpotlight);
router.get('/list', setPagination, controller.list);
router.get('/view/:_id', controller.view);
router.get('/guaranteed-products', authentication, setPagination, controller.adminSellerProducts);


module.exports = router;