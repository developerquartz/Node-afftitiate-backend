"use strict";
const utils = require("../../../utils");
const UserServices = require("../services");
const TemplateServices = require("../services/templates");
const { sendEmail } = require("../../../lib/ses");

exports.profile = async (req, res) => {
  try {
    const { password, _id, ...userWithoutSensitiveInfo } = req.user.toObject();
    return res.success("RECORD_FOUND", userWithoutSensitiveInfo);
    // return res.success("RECORD_FOUND", req.user);
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    let { type, otp, countryCode, mobileNumber, email, name, altMobileNumber, altCountryCode, hintName, storeName, storeDescription, company } = req.body;

    if(type === "profile") {
      const setData = { name };
      if (altMobileNumber && altCountryCode) {
        setData.altCountryCode = altCountryCode;
        setData.altMobileNumber = altMobileNumber;
      }
      // else{
      //   setData.altCountryCode = '';
      //   setData.altMobileNumber = '';
      // }
      // console.log(setData);
      if (hintName) {
        setData.hintName = hintName;
      }
      if (storeName) {
        setData.storeName = storeName.toLowerCase();
      }
      if (storeDescription) {
        setData.storeDescription = storeDescription;
      }

      if (company) { setData.company = company; }
  
      let user = await UserServices.update({ _id: req.user._id }, setData);
  
      return res.success("PROFILE_UPDATED_SUCCESS", user);
    }
    else if(type === "mobile") {

      await UserServices.mobileOtp(mobileNumber, countryCode, otp);

      let user = await UserServices.update({ _id: req.user._id }, { mobileNumber, countryCode });

      return res.success("MOBILE_NUMBER_UPDATED", user);
    }
    else if(type === "email") {
      await UserServices.emailOtp(email, otp);

      let user = await UserServices.update({ _id: req.user._id }, { email });

      return res.success("EMAIL_UPDATED", user);
    }

    return res.error("SOMETHING_WENT_WRONG");
    
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

exports.changePassword = async (req, res) => {
  try {
    let { currentPassword, password, confirmPassword } = req.body;

    const isValid = await utils.verifyPassword(
      req.user.password,
      currentPassword
    );

    if (!isValid) return res.error("INVALID_CURRENT_PASSWORD");

    if (currentPassword === password) return res.error("CHOOSE_DIFF_PASSWORD");

    await UserServices.update(
      { _id: req.user._id },
      { password: await utils.hashPassword(password) }
    );

    return res.success("PASSWORD_UPDATED");
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};

exports.emailUpdate = async (req, res) => {
  try {
    let user = req.user;
    // console.log("user",user)
    let _id = user._id;
    const hasData = await UserServices.findOne(
      {
        _id: user._id,
      },
      "_id"
    );

    // console.log("hasData",hasData);

    if (!hasData) {
      return res.error("NO_RECORD_FOUND");
    }

    

    let data = req.body;

    let isValid = await UserServices.emailOtp(data.email, data.otp, false);
    console.log("isValid:",isValid);
    if(!isValid){ res.error("OTP_NOT_MATCHED"); }
    const setData = {
      email: data.email,
    };

    const useremailupdate = await UserServices.updateEmail({ _id }, setData);

    return res.success("USER_EMAIL_UPDATED", useremailupdate);
  } catch (error) {
    console.error(error);
    res.error(error);
  }
};