const express = require('express');
const router = express.Router();
const validator = require('./validators/affiliateWallet');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const affiliateWallet = require('./controllers/affiliateWallet');

router.post('/add', authentication, validator.addValidate, affiliateWallet.add);
router.get('/list', authentication,setPagination, affiliateWallet.list);
router.get("/view", authentication, affiliateWallet.view);
// router.put('/update/:_id', authentication, validator.updateValidate, affiliateWallet.update);
// router.delete('/delete/:_id', authentication, validator.deleteValidate, affiliateWallet.deleteOne);
// router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, affiliateWallet.deleteOnePermanent);

router.get("/adm-view/:_id", authentication, validator.admViewValidate, affiliateWallet.admView);
router.put('/adm-update/:_id', authentication, validator.admUpdateValidate, affiliateWallet.admUpdate);

module.exports = router;