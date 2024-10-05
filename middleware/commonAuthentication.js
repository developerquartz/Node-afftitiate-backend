const { verifyToken } = require("../utils");
const UserServices = require('../modules/users/services');
const SessionServices = require('../modules/users/services/session');

const commonAuthenticate = async (req, res, next) => {
    req.deviceId = req.headers?.deviceid;
    req.isLogin = false;
    try {

        if (!req.deviceId) {
            return res.error({
                message: 'REQUIRED_DEVICE_ID',
                code: 401

            });
        }

        const authorizationHeader = req.get('Authorization');

        if (!authorizationHeader) {
            next();
        }
        else {
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
            req.isLogin = true;

            next();
        }

    } catch (error) {
        return res.error({
            message: "INVALID_TOKEN",
            code: 401
        });
    }
};


module.exports = commonAuthenticate;