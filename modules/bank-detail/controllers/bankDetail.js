// const AffiliateProgram = require('../../../models/affiliateProgram');
const bankDetailServices = require('../services');
const affiliateBankDetailTable = require('../../../models/affiliateBankDetailTable');

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');

module.exports = {
  // Add a new commission request
  add: async (req, res) => {
    try {
      const user = req.user;
      const query = {
        // _id: new mongoose.Types.ObjectId(_id),
        user: user._id
      };

      const bankDetails = await affiliateBankDetailTable.find(query);
      if(bankDetails.length === 0){
        let data = req.body;
        data.user = user._id;
        // data.status = "active";
        const { date, utcDate } = utils.getDate();
        data.date_created_utc = utcDate;
        data.date_created = date;

        const bankDetailSaved = await bankDetailServices.create(data);
      
        return res.success("Bank detail added successfully.", { bankDetailSaved });
      }
      else{
        return res.error("Bank detail already exist.");
      }
    } catch (error) {
    console.error(error);
    res.error(error);
    }
  },

  // Get a list of all commission requests
  list: async (req, res) => {
    try {
      // let query = { status: "active" };
      const user = req.user;
      const _id = new mongoose.Types.ObjectId(req.params._id);
      const query = { user: user._id, status: {$ne : "archived"}};
      
      let items = await bankDetailServices.list(query, req.paginationOptions);
      let total = await bankDetailServices.countData(query);

      return res.success(req.nextPageOptions(items, total));
    } catch (error) {
        console.error(error);
        res.error(error);
    }
  },

  // Get a single commission request by ID
  view: async (req, res) => {
      try {
        const user = req.user;
        // const { _id } = req.params; // Assuming `_id` is passed as a URL parameter

        // Validate the _id
        // if (!mongoose.Types.ObjectId.isValid(_id)) {
        //     return res.status(400).json({ error: "Invalid ID format" });
        // }

        // Construct the query
        const query = {
            // _id: new mongoose.Types.ObjectId(_id),
            user: user._id
        };

        const bankDetails = await affiliateBankDetailTable.findOne(query);
        // res.status(200).json(bankDetails);
        if(bankDetails.length === 0){
          return res.success("Bank detail does not added.");
        }
        else{
          return res.success("Bank details", bankDetails);
        }
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

  // Update an commission request by ID
  update: async (req, res) => {
      try {
      let user = req.user;
      let _id = req.params._id;
  
      // Check if the Affiliate Program exists for the user
      const hasData = await bankDetailServices.findOne(
        { _id, user: user._id },
        "_id affiliatebankdetails"
      );
  
      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }
  
      let data = req.body;

      // Prepare the data to update
      const setData = {
        user: user._id,
        bankName: data.bankName,
        bankAddress:data.bankAddress,
        accountNumber: data.accountNumber,
        accountHolderName: data.accountHolderName,
        ifscCode: data.ifscCode,
        currency: data.currency,
        country: data.country,
        routingNumber: data.routingNumber,
        accountType: data.accountType,
        swiftCode: data.swiftCode,
        taxIdentificationNumber: data.taxIdentificationNumber,
      };


      // Update the Affiliate Program record
      const commission_request = await bankDetailServices.update({ _id }, setData);
    
      return res.success("Bank detail updated successfully.", commission_request);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },

  // Delete an commission request by ID
  deleteOne: async (req, res) => {
      try {
          let user = req.user;
          let _id = new mongoose.Types.ObjectId(req.params._id);
    
          let response = await bankDetailServices.deleteOne({ _id, user: user._id });
          // console.log("response::",response);
          return res.success(response);
        } catch (error) {
          console.error(error);
          res.error(error);
        }
  },

  // Delete an commission request by ID
  deleteOnePermanent: async (req, res) => {
    try {
        let user = req.user;
        let _id = new mongoose.Types.ObjectId(req.params._id);
  
        const BankDetailDeleted = await bankDetailServices.deleteOnePermanent({ _id, user: user._id });
        // console.log("BankDetailDeleted::"+BankDetailDeleted);
        return res.success('Bank detail deleted successfully');
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

};
