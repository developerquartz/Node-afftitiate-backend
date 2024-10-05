const express = require('express');
const router = express.Router();
const validator = require('./validators/auth');
const userValidator = require('./validators/user');
const authController = require('./controllers/auth');
const userController = require('./controllers/user');
const { authentication } = require('../../middleware');

router.post('/login',  validator.login, authController.login);

router.post('/verifyEmail', validator.verifyEmail, authController.verifyEmail);
router.post('/verifyMobileNumber', validator.verifyMobileNumber, authController.verifyMobileNumber);
router.post('/register',  validator.register, authController.register);
router.post('/verifyOtp', validator.verifyOtp, authController.verifyOTP);
router.post('/forgotPassword', validator.forgotPassword, authController.forgotPassword);
router.post('/resetPassword', validator.resetPassword, authController.resetPassword);
router.post('/resendOtp', validator.resendOtp, authController.resendOtp);
router.post('/resendOtpEmailUpdate', validator.resendOtpEmailUpdate, authController.resendOtpEmailUpdate);
router.post('/checkStoreExist', validator.checkStoreExist, authController.checkStoreExist);

router.post('/logout', authentication, authController.logout);
router.get('/logout', authentication, authController.logout);

router.get('/profile', authentication, userController.profile);
router.put('/update', authentication, userValidator.updateProfile, userController.updateProfile);
router.put('/changePassword', authentication, userValidator.changePassword, userController.changePassword);
router.put('/updateEmail', authentication, userValidator.emailupdateValidate, userController.emailUpdate);

module.exports = router;