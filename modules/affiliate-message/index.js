const express = require('express');
const router = express.Router();
const validator = require('./validators/message');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const message = require('./controllers/message');

router.post('/add', authentication, validator.addValidate, message.add);
router.get('/list', authentication,setPagination, message.list);
router.get("/view/:_id", authentication, validator.viewValidate, message.view);
router.put('/update/:_id', authentication, validator.updateValidate, message.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, message.deleteOne);
router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, message.deleteOnePermanent);

module.exports = router;