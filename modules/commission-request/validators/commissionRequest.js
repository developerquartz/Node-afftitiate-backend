
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
  validObjectId,
  arrayRequiredProducts,
  numberRequired,
} = require("../../../helpers/validationHelper");
const Joi = require("joi");

const addValidate = (req, res, next) => {
    try {
    let isValid = validateRequest(req.body, {
        amount: numberRequired,
        paymentIntentId: stringAllowNull,
        // status: stringRequired,
    });

    if (isValid) {
        return next();
    }
    } catch (error) {
    console.error(error);
    res.error(error);
    }
};

const viewValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: stringRequired,
        });
        if (isValidId) {
            return next();
        }
    } catch (error) {
        console.error(error);
        res.error(error);
    }
};

const updateValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: stringRequired,
        });
        
        let isValidPost = validateRequest(req.body, {
            amount: numberRequired,
            paymentIntentId: stringAllowNull,
            // status: stringRequired,
        });

        if (isValidId && isValidPost) {
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

const deleteValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: validObjectId,
        });
        if (isValidId) {
            return next();
        }
    } catch (error) {
        console.error(error);
        res.error(error);
    }
};

const deletePermanentValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: validObjectId,
        });
        if (isValidId) {
            return next();
        }
    } catch (error) {
        console.error(error);
        res.error(error);
    }
};

module.exports = {
    addValidate,
    viewValidate,
    updateValidate,
    deleteValidate,
    deletePermanentValidate,
  };