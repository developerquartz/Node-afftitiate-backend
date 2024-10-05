const express = require('express');
const router = express.Router();
const validator = require('./validators/productClick');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const productClick = require('./controllers/productClick');

router.post('/add', validator.addValidate, productClick.add);
router.get('/list', authentication,setPagination, productClick.list);
router.get("/view/:_id", authentication, validator.viewValidate, productClick.view);
// router.put('/update/:_id', authentication, validator.updateValidate, productClick.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, productClick.deleteOne);
router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, productClick.deleteOnePermanent);

router.get('/ProductClickChart/', authentication, productClick.ProductClickChart);

module.exports = router;