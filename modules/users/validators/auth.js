const utils = require("../../../utils/globals");
const {
  stringRequired,
  emailRequired,
  passwordRequired,
  validateRequest,
  confirmPasswordRequired,
  stringRequiredValid,
  stringAllowNull,
  validateObject,
  passwordLogin,
} = require("../../../helpers/validationHelper");
const Joi = require("joi");

const login = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      email: stringRequired,
      password: passwordLogin,
    });

    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const verifyEmail = (req, res, next) => {
  try {
    const isValid = validateRequest(req.body, {
      email: emailRequired,
    });

    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const verifyMobileNumber = (req, res, next) => {
  try {
    const isValid = validateRequest(req.body, {
      mobileNumber: stringRequired,
      countryCode: stringRequired,
    });

    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};
 
const register = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      email: emailRequired,
      password: passwordRequired,
      confirmPassword: confirmPasswordRequired(),
      emailOtp: stringRequired,
      role:stringRequired,
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

const verifyOtp = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      type: stringRequiredValid("mobile", "email"),
      otp: stringRequired,
      email: Joi.when("type", {
        is: "mobile",
        then: stringAllowNull,
        otherwise: emailRequired,
      }),
      mobileNumber: Joi.when("type", {
        is: "mobile",
        then: stringRequired,
        otherwise: stringAllowNull,
      }),
      countryCode: Joi.when("type", {
        is: "mobile",
        then: stringRequired,
        otherwise: stringAllowNull,
      }),
    });
    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const forgotPassword = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      email: emailRequired,
    });
    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const resetPassword = (req, res, next) => {
  try {
    let isValid = validateRequest(req.body, {
      otp: stringRequired,
      email: emailRequired,
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

const resendOtp = (req, res, next) => {
  try {
    const isValid = validateRequest(req.body, {
      email: emailRequired,
    });

    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const resendOtpEmailUpdate = (req, res, next) => {
  try {
    const isValid = validateRequest(req.body, {
      email: emailRequired,
      // oldEmail: emailRequired,
    });

    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

const checkStoreExist = (req, res, next) => {
  try {
    const isValid = validateRequest(req.body, {
      storeName: stringRequired,
    });

    if (isValid) {
      return next();
    }
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

module.exports = {
  verifyEmail,
  verifyMobileNumber,
  login,
  register,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
  resendOtpEmailUpdate,
  checkStoreExist,
};
