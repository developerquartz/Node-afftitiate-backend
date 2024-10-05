const affiliateSaleServices = require('../services');
const affiliateSaleTable = require('../../../models/affiliateSaleTable');

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');

module.exports = {
  // Add a new commission request
  add: async (req, res) => {
    try {
      // const user = req.user;
      const data = req.body;
      const query = {
        // _id: new mongoose.Types.ObjectId(_id),
        user: data.user,
        order: data.order,
      };

      const affiliateSale = await affiliateSaleTable.find(query);
      if(affiliateSale.length === 0){
        let data = req.body;
        // data.user = user._id;
        // data.status = "active";
        const { date, utcDate } = utils.getDate();
        data.date_created_utc = utcDate;
        data.date_created = date;

        const affiliateSaleaved = await affiliateSaleServices.create(data);
      
        return res.success("Sale detail added successfully.", { affiliateSaleaved });
      }
      else{
        return res.error("Sale detail already exist.");
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
      
      let items = await affiliateSaleServices.list(query, req.paginationOptions);
      let total = await affiliateSaleServices.countData(query);

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

        const affiliateSale = await affiliateSaleTable.findOne(query);
        // res.status(200).json(affiliateSale);
        if(affiliateSale.length === 0){
          return res.success("Sale detail does not added.");
        }
        else{
          return res.success("Sale details", affiliateSale);
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
      const hasData = await affiliateSaleServices.findOne(
        { _id, user: user._id },
        "_id affiliateaffiliateSale"
      );
  
      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }
  
      let data = req.body;

      // Prepare the data to update
      const setData = {
        user: user._id,
        SaleName: data.SaleName,
      };


      // Update the Affiliate Program record
      const commission_request = await affiliateSaleServices.update({ _id }, setData);
    
      return res.success("Sale detail updated successfully.", commission_request);
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
    
          let response = await affiliateSaleServices.deleteOne({ _id, user: user._id });
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
  
        const affiliateSaleDeleted = await affiliateSaleServices.deleteOnePermanent({ _id, user: user._id });
        // console.log("affiliateSaleDeleted::"+affiliateSaleDeleted);
        return res.success('Sale detail deleted successfully');
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

};
