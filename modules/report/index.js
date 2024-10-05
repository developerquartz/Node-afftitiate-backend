const express = require('express');
const router = express.Router();
const validator = require('./validators/report');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const report = require('./controllers/report');

// router.post('/add', validator.addValidate, report.add);
// router.get('/list', authentication,setPagination, report.list);
// router.get("/view/:_id", authentication, validator.viewValidate, report.view);
// router.put('/update/:_id', authentication, validator.updateValidate, report.update);
// router.delete('/delete/:_id', authentication, validator.deleteValidate, report.deleteOne);
// router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, report.deleteOnePermanent);

router.get('/ProductClickReport/', authentication, report.ProductClickReport);
router.get('/TotalCommissionReport/', authentication, report.TotalCommissionReport);

router.get('/ProductSaleChart/', authentication, report.ProductSaleChart);
router.get('/ProductCommissionChart', authentication, report.ProductCommissionChart);
router.get('/SingleProductCommissionChart/:_id', authentication, report.SingleProductCommissionChart);
router.get('/SingleProductClickChart/:_id', authentication, report.SingleProductClickChart);
router.get('/SingleAffiliateProgramSaleChart/:_id', authentication, report.SingleAffiliateProgramSaleChart);
router.get('/SingleAffiliateProgramClickChart/:_id', authentication, report.SingleAffiliateProgramClickChart);
router.get('/SingleProductClickChartNew/:_id', authentication, report.SingleProductClickChartNew);


router.get('/ProductClickSaleListing/', authentication, report.ProductClickSaleListing);
router.get('/SingleProductClickSaleListing/:_id', authentication, report.SingleProductClickSaleListing);

router.get('/AffiliateProgramClickSaleListing/', authentication,setPagination, report.AffiliateProgramClickSaleListing);
router.get('/SingleAffiliateProgramClickSaleListing/:_id', authentication,setPagination, report.SingleAffiliateProgramClickSaleListing);

// Test


module.exports = router;