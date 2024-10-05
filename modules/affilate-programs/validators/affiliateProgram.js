
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
  arrayRequired,
  arrayRequiredProducts,
  numberRequired,
} = require("../../../helpers/validationHelper");
const Joi = require("joi");
const { Console } = require("winston/lib/winston/transports");

const addValidate = (req, res, next) => {
    try {
    let isValid = validateRequest(req.body, {
        name: stringRequired,
        country: stringRequired,
        products: stringAllowNull,
        image: stringAllowNull,
        bio: stringRequired,
        description: stringRequired,
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
        // console.log("req.body::",req.body);
        let isValidPost = validateRequest(req.body, {
            name: stringRequired,
            country: stringRequired,
            products: stringAllowNull,
            image: stringAllowNull,
            bio: stringAllowNull,
            description: stringAllowNull,
            status: stringAllowNull,
        });

        if (isValidId && isValidPost) {
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

const deleteManyValidate = (req, res, next) => {
    try {
        // console.log("req.body::",req.body);
        let isValidPost = validateRequest(req.body, {
            ids: arrayRequired,
        });

        if (isValidPost) {
            return next();
        }
    } catch (error) {
        console.error(error);
        res.error(error);
    }
};


const updateProComValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            _id: stringRequired,
        });
        
        let isValidPost = validateRequest(req.body, {
            // affiliateCommission: numberRequired,
            // platformCommissionFee: numberRequired,
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

const listAffiProsValidate = (req, res, next) => {
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

const listAffiProProdsValidate = (req, res, next) => {
    try {
        let isValidId = validateRequest(req.params, {
            affi_user: stringRequired,
            affi_pro: stringRequired,
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
    deleteManyValidate,
    updateProComValidate,
    listAffiProsValidate,
    listAffiProProdsValidate,
  };