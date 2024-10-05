// const AffiliateProgram = require('../../../models/affiliateProgram');
const affiliateWalletServices = require('../services');
const affiliateWalletTable = require('../../../models/affiliateWalletTable');

const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');

module.exports = {
  // Add a new commission request
  add: async (req, res) => {
    try {
      let data = req.body;
      // const user = req.user;
      const query = {
        // _id: new mongoose.Types.ObjectId(_id),
        // user: user._id
        user: data.user
      };

      // const query = {};
      const affiliateWallet = await affiliateWalletTable.find(query);
      if(affiliateWallet.length === 0){
        
        // data.user = user._id;
        data.user = data.user;
        const { date, utcDate } = utils.getDate();
        data.date_created_utc = utcDate;
        data.date_created = date;

        const affiliateWalletSaved = await affiliateWalletServices.create(data);
      
        return res.success("Wallet added successfully.", { affiliateWalletSaved });
      }
      else{
        return res.error("Wallet already exist.");
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
      
      let items = await affiliateWalletServices.list(query, req.paginationOptions);
      let total = await affiliateWalletServices.countData(query);

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
            // user: _id
        };

        const affiliateWallet = await affiliateWalletTable.findOne(query);
        // res.status(200).json(affiliateWallet);
        if(affiliateWallet.length === 0){
          return res.success("Wallet does not added.");
        }
        else{
          return res.success("Wallets", affiliateWallet);
        }
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

  // Update an commission request by ID
  /* update: async (req, res) => {
      try {
      let user = req.user;
      let _id = req.params._id;
  
      // Check if the Affiliate Program exists for the user
      const hasData = await affiliateWallet.findOne(
        { _id, user: user._id },
        "_id affiliateWallet"
      );
  
      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }
  
      let data = req.body;

      // Prepare the data to update
      const setData = {
        // user: user._id,
        balance: data.balance,
        currency:data.currency,
      };


      // Update the Affiliate Program record
      const affiliateWalletUpdated = await affiliateWalletServices.update({ _id }, setData);
    
      return res.success("Wallet updated successfully.", affiliateWalletUpdated);
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
    
          let response = await affiliateWalletServices.deleteOne({ _id, user: user._id });
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
  
        const BankDetailDeleted = await affiliateWalletServices.deleteOnePermanent({ _id, user: user._id });
        // console.log("BankDetailDeleted::"+BankDetailDeleted);
        return res.success('Wallet deleted successfully');
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  }, */

  // Get a single commission request by ID
  admView: async (req, res) => {
      try {
        const user = req.user;
        const { _id } = req.params; // Assuming `_id` is passed as a URL parameter
        
        // Validate the _id
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        
        const query = { user: _id };
        const affiliateWallet = await affiliateWalletTable.findOne(query);
        if(affiliateWallet.length === 0){
          return res.success("Wallet does not added.");
        }
        else{
          return res.success("Adm Wallets", affiliateWallet);
        }
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

  admUpdate: async (req, res) => {
    try {
    let user = req.user;
    let _id = req.params._id;
    let data = req.body;

    // Check if the Affiliate Program exists for the user
    const hasData = await affiliateWalletServices.findOne( { user: _id } );
    console.log(hasData);
    if (!hasData) {
      return res.error("NO_RECORD_FOUND");
    }

    if(data.amount <= 0){
      return res.error("Debit amount does not nagitive.");
    }

    let newBalance=0;
    if(data.action === 'credit'){
      newBalance = hasData.balance + data.amount;
    }
    else if(data.action === 'debit'){
      if(hasData.balance < data.amount){
        return res.error("Debit amount does not greater than avaliable balance.");
      }
      newBalance = hasData.balance - data.amount;
    }
    else{
      newBalance = hasData.balance;
    }

    console.log(hasData.balance+" : "+data.amount)
    // Prepare the data to update
    const setData = {
      balance: newBalance,
    };


    // Update the Affiliate Program record
    const affiliateWalletUpdated = await affiliateWalletServices.admUpdate({ user: _id }, setData);
  
    return res.success("Wallet updated successfully.", affiliateWalletUpdated);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },

};
