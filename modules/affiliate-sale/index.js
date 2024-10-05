const express = require('express');
const router = express.Router();
const validator = require('./validators/affiliateSale');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const affiliateSale = require('./controllers/affiliateSale');

router.post('/add', authentication, validator.addValidate, affiliateSale.add);
router.get('/list', authentication,setPagination, affiliateSale.list);
router.get("/view", authentication, affiliateSale.view);
router.put('/update/:_id', authentication, validator.updateValidate, affiliateSale.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, affiliateSale.deleteOne);
router.delete('/deletePermanent/:_id', authentication, validator.deletePermanentValidate, affiliateSale.deleteOnePermanent);

module.exports = router;