const express = require('express');
const router = express.Router();
const controller = require('./controllers');
const { authentication, authorization } = require("../../middleware");

router.get('/list', controller.list);
router.get('/top-cat', controller.topCategories);
router.get('/source-application', controller.sourceByApplicatonCat);

module.exports = router;