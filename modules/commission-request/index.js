const express = require('express');
const router = express.Router();
const validator = require('./validators/commissionRequest');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const commissionRequest = require('./controllers/commissionRequest');

router.post('/add', authentication, validator.addValidate, commissionRequest.add);
router.get('/list', authentication,setPagination, commissionRequest.list);
router.get("/view/:_id", authentication, validator.viewValidate, commissionRequest.view);
router.put('/update/:_id', authentication, validator.updateValidate, commissionRequest.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, commissionRequest.deleteOne);
router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, commissionRequest.deleteOnePermanent);

module.exports = router;