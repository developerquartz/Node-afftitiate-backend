const moment = require("moment");
const UserModel = require("../../../models/userTable");
const CartModel = require("../../../models/cartTable");
const OTPModel = require("../../../models/otp");
const utils = require("../../../utils");

const isValidOtp = (data, otp, del = true) => {
  if (!data) throw new Error("OTP_USED");

  if (otp.toString() !== data.otp.toString())
    throw new Error("OTP_NOT_MATCHED");

  if (moment().isAfter(moment(data.otpExpires)))
    throw new Error("VERIFICATION_CODE_EXPIRED");

  if (del) OTPModel.deleteOne({ _id: data._id }).exec();
};

exports.emailOtp = async (email, otp, del = true) => {
  const data = await OTPModel.findOne({ email: email.toLowerCase() })
    .sort({ createdAt: -1 })
    .exec();
  isValidOtp(data, otp, del);
  return true;
};

exports.mobileOtp = async (mobileNumber, countryCode, otp, del = true) => {
  const data = await OTPModel.findOne({ mobileNumber, countryCode })
    .sort({ createdAt: -1 })
    .exec();
  isValidOtp(data, otp, del);
};

exports.createOtp = async (data) => {
  // const otp = utils.generateOTP(4);
  const otp = "1111";
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5);
  await OTPModel.deleteMany(data);
  await OTPModel.create({
    ...data,
    otp: otp,
    otpExpires: date,
  });
  return otp;
};

exports.findOne = async (query, select = null) => {
  return await UserModel.findOne(query, select);
};

// Email exists or not
exports.emailExist = async function (email) {
  const exists = await UserModel.findOne({
    email: email.toLowerCase(),
    status: { $nin: ["archived"] },
  }).exec();

  return exists !== null;
};

// Mobile no exists or not
exports.mobileNumberExist = async function (mobileNumber, countryCode) {
  const exists = await UserModel.findOne({
    mobileNumber: mobileNumber,
    countryCode: countryCode,
    status: { $nin: ["archived"] },
  }).exec();

  return exists !== null;
};

// Login user
exports.login = async function (data) {
  const user = await UserModel.findOne({
    email: data.email,
    role: env.ROLE,
    status: { $ne: "archived" },
  });

  if (!user) throw new Error("INVALID_EMAIL");

  // console.log(user);

  if (user.status === "blocked") throw new Error("ACCOUNT_BLOCKED");

  let isValid = await utils.verifyPassword(user.password, data.password);
  if (!isValid) throw new Error("INCORRECT_PASSWORD");

  const token = utils.generateToken(user);
  await user.save();

  return { user, token };
};

// Find by email
exports.findByEmail = async function (
  email,
  notIn = ["archived"],
  select = null,
  query = {}
) {
  return await UserModel.findOne(
    {
      email: email.toLowerCase(),
      status: { $nin: notIn },
      ...query,
    },
    select
  ).exec();
};

// Find by mobile number
exports.findByMobileNumber = async function (
  mobileNumber,
  countryCode,
  notIn = ["archived"],
  select = null,
  query = {}
) {
  return await UserModel.findOne(
    {
      mobileNumber: mobileNumber,
      countryCode,
      status: { $nin: notIn },
      ...query,
    },
    select
  ).exec();
};

// Update or create
exports.update = async function (query, data) {
  return await UserModel.findOneAndUpdate(query, data, {
    new: true,
    upsert: true,
  });
};

exports.create = async function (data) {
  const user = new UserModel(data);
  await user.save();
  return user;
};


exports.mergeCart = async function (user, deviceId) {
  const deviceCart = await CartModel.find({ deviceId, cartType: "temp" });
  if (deviceCart) {
    const userCart = await CartModel.find({ user });
    if (userCart) { // Merge cart
      for (const cartItem of deviceCart) {
        const hasUserCart = userCart.find((item) => item.product.toString() === cartItem.product.toString());
        if (hasUserCart) {
          for (const item of cartItem.items) {
            const userCartIndex = hasUserCart.items.findIndex(userItem => !userItem.variation_id || userItem.variation_id.toString() === item.variation_id.toString());
            if (userCartIndex !== -1) {
              hasUserCart.items[userCartIndex].quantity += item.quantity;
              hasUserCart.items[userCartIndex].amount += item.unitPrice * hasUserCart.items[userCartIndex].quantity;
            }
            else {
              hasUserCart.items.push(item);
            }
          }
          await CartModel.updateOne({ _id: hasUserCart._id }, {
            subTotal: hasUserCart.subTotal + cartItem.subTotal,
            items: hasUserCart.items,
            cartType: "default",
          }).exec();
        }
        else {
          await CartModel.updateOne({ _id: cartItem._id }, { user, cartType: "default" }).exec();
        }
      }

      await CartModel.deleteMany({ deviceId, cartType: "temp" }).exec();
    }
    else {
      await CartModel.updateMany({ _id: { $in: deviceCart.map((cart) => cart._id) } }, { user, cartType: "default" }).exec();
    }
  }
}

// Update or create
exports.updateEmail = async function (query, data) {
  // console.log('query:',query);
  // console.log('data:',data);
  return await UserModel.findOneAndUpdate(query, data, {
    new: true,
    upsert: true,
  });
};

let findOne = function (query = null, select = null) {
  // console.log('query:',query);
  return UserModel.findOne(query, select).lean();
};

// Find by mobile number
exports.findByStoreName = async function (
  storeName,
  select = null,
  query = {}
) {
  return await UserModel.findOne(
    {
      storeName: storeName.toLowerCase(),
      ...query,
    },
    select
  ).exec();
};