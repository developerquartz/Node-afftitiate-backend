const express = require('express');
const router = express.Router();
const validator = require('./validators/productCommission');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const prodCommController = require('./controllers/productCommission');



router.post('/add', authentication, validator.addValidate, prodCommController.add);
router.get('/list', authentication,setPagination, prodCommController.list);
router.get("/view/:_id", authentication, validator.viewValidate, prodCommController.view);
router.put('/update/:_id', authentication, validator.updateValidate, prodCommController.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, prodCommController.deleteOne);

// router.get('/listAggregate', authentication, setPagination, prodCommController.listAggregate);
// router.get('/listAggregateProducts', authentication, setPagination, prodCommController.listAggregateProducts);
// router.put('/updateProCom/:_id', authentication, validator.updateProComValidate, prodCommController.updateProCom);

module.exports = router;