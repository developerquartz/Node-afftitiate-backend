const express = require('express');
const router = express.Router();
const validator = require('./validators/affiliateProgram');
const authController = require('../users/controllers/auth');
const userController = require('../users/controllers/user');
const { authentication } = require('../../middleware');
const setPagination = require('../../middleware/setPagination');

const affiProgController = require('./controllers/affiliateProgram');

const upload = require('../../lib/awsimageupload');


router.post('/add', authentication, upload.single('image'), validator.addValidate, affiProgController.add);
router.get('/list', authentication,setPagination, affiProgController.list);
router.get("/view/:_id", authentication, validator.viewValidate, affiProgController.view);
router.put('/update/:_id', authentication, upload.single('image'), validator.updateValidate, affiProgController.update);
router.delete('/delete/:_id', authentication, validator.deleteValidate, affiProgController.deleteOne);
router.put('/deleteMany/', authentication, validator.deleteManyValidate, affiProgController.deleteMany);
router.get('/unusedList', authentication,setPagination, affiProgController.unusedList);

router.get('/listAggregate', authentication, setPagination, affiProgController.listAggregate);
router.get('/listAggregateProducts', authentication, setPagination, affiProgController.listAggregateProducts);
// router.put('/updateProCom/:_id', authentication, validator.updateProComValidate, affiProgController.updateProCom);

router.get('/totalCounts', authentication, affiProgController.totalCounts);



// Front End APIs
router.get('/listAffiPros/:_id', setPagination,validator.listAffiProsValidate, affiProgController.listAffiPros);
router.get('/listAffiProProds', setPagination, affiProgController.listAffiProProds);
router.get('/listAffiProdAggregate/:_id', setPagination, affiProgController.listAffiProdAggregate);

module.exports = router;