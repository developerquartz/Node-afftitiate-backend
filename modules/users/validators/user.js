const Joi = require("joi");
const {
  stringRequired,
  emailRequired,
  validateRequest,
  stringAllowNull,
  passwordRequired,
  confirmPasswordRequired,
  stringRequiredValid,
  validateWhen,
  validateObject
} = require("../../../helpers/validationHelper");

const updateProfile = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      type: stringRequiredValid("profile", "mobile", "email"),
      mobileNumber: validateWhen("type", "mobile", stringAllowNull),
      countryCode: validateWhen("type", "mobile", stringAllowNull),
      email: validateWhen("type", "email", stringAllowNull),
      otp: validateWhen("type", "profile", stringAllowNull),
      name: validateWhen("type", "profile", stringAllowNull),
      altMobileNumber: validateWhen("type", "profile", stringAllowNull),
      altCountryCode: validateWhen("type", "profile", stringAllowNull),
      hintName: validateWhen("type", "profile", stringAllowNull),
      storeName:stringRequired,
      storeDescription:stringRequired.min(50).max(500),
      company:validateObject({
        companyName: stringAllowNull,
        website: stringAllowNull,
        estimatedAnnualRevenue: stringAllowNull,
      })
    });
    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const changePassword = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      currentPassword: stringRequired,
      password: passwordRequired,
      confirmPassword: confirmPasswordRequired(),
    });
    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const emailupdateValidate = (req, res, next) => {
  try {
      let isValidPost = validateRequest(req.body, {
          email: emailRequired,
          otp: stringRequired,
      });

      if (isValidPost) {
          return next();
      }
      if (isValid) {
          return next();
      }
  } catch (error) {
  console.error(error);
  res.error(error);
  }
};

module.exports = {
  updateProfile,
  changePassword,
  emailupdateValidate,
};
