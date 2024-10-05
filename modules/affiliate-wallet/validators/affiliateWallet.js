
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
        user: stringRequired,
        balance:stringAllowNull,
        currency: stringAllowNull,
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

const ViewValidate = (req, res, next) => {
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

/* const updateValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: stringRequired,
        });
        
        let isValidPost = validateRequest(req.body, {
            user: stringRequired,
            balance:stringAllowNull,
            currency: stringAllowNull,
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
}; */

const admViewValidate = (req, res, next) => {
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

const admUpdateValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: stringRequired,
        });
        
        let isValidPost = validateRequest(req.body, {
            // user: stringRequired,
            action: stringRequired,
            amount:numberRequired
            // balance:stringAllowNull,
            // currency: stringAllowNull,
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

module.exports = {
    addValidate,
    ViewValidate,
    // updateValidate,
    // deleteValidate,
    // deletePermanentValidate,
    admViewValidate,
    admUpdateValidate,
  };