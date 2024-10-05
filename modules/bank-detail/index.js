const express = require('express');
const router = express.Router();
const validator = require('./validators/bankDetail');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const bankDetail = require('./controllers/bankDetail');

router.post('/add', authentication, validator.addValidate, bankDetail.add);
router.get('/list', authentication,setPagination, bankDetail.list);
router.get("/view", authentication, bankDetail.view);
router.put('/update/:_id', authentication, validator.updateValidate, bankDetail.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, bankDetail.deleteOne);
router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, bankDetail.deleteOnePermanent);

module.exports = router;