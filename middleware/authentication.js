const { verifyToken } = require("../utils");
const UserServices = require('../modules/users/services');
const SessionServices = require('../modules/users/services/session');

const authenticate = async (req, res, next) => {
    try {

        const authorizationHeader = req.get('Authorization');

        if (!authorizationHeader) {
            return res.error({
                message: "AUTHORIZATION_TOKEN_IS_REQUIRED",
                code: 401

            });
        }

        const token = authorizationHeader.replace('Bearer ', '');

        const decodedToken = verifyToken(token);

        const hasToken = await SessionServices.hasToken(decodedToken._id, token);
        if (!hasToken)
            return res.error({
                message: 'NOT_AUTHORIZED',
                code: 401
            });

        const user = await UserServices.findOne({ _id: decodedToken.id || decodedToken._id, status: { $ne: "temp" }, role: env.ROLE });

        if (!user)
            return res.error({
                message: 'NOT_AUTHORIZED',
                code: 401
            });

        if (user.status === "inactive")
            return res.error({
                message: "ACCOUNT_INACTIVE",
                code: 401
            });

        if (user.status === "blocked")
            return res.error({
                message: "ACCOUNT_BLOCKED",
                code: 401
            });


        req.user = user;
        req.token = token;

        next();

    } catch (error) {
        return res.error({
            message: "INVALID_TOKEN",
            code: 401

        });
    }
};


module.exports = authenticate;