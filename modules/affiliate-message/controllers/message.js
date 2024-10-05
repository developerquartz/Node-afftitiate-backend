// const AffiliateProgram = require('../../../models/affiliateProgram');
const affiliateMessageServices = require('../services');
const affiliateMessageTable = require('../../../models/affiliateMessageTable');

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');

module.exports = {
  // Add a new commission request
  add: async (req, res) => {
      try {
          let data = req.body;
          data.user = req.user._id; 
          // data.status = "active";
          const { date, utcDate } = utils.getDate();
          data.date_created_utc = utcDate;
          data.date_created = date;

          const commission_request = await affiliateMessageServices.create(data);
        
          return res.success("Message send successfully.", { commission_request });
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
        
        let items = await affiliateMessageServices.list(query, req.paginationOptions);
        let total = await affiliateMessageServices.countData(query);

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
        const { _id } = req.params; // Assuming `_id` is passed as a URL parameter

        // Validate the _id
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        // Construct the query
        const query = {
            _id: new mongoose.Types.ObjectId(_id),
            user: user._id
        };

        const commissionRequests = await affiliateMessageTable.find(query);
        // res.status(200).json(commissionRequests);
        return res.success("Message", commissionRequests);
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
      const hasData = await affiliateMessageServices.findOne(
        { _id, user: user._id },
        "_id affiliatemessage"
      );
  
      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }
  
      let data = req.body;

      // Prepare the data to update
      const setData = {
        user: user._id,
        message: data.message,
      };


      // Update the Affiliate Program record
      const commission_request = await affiliateMessageServices.update({ _id }, setData);
    
      return res.success("Message updated successfully.", commission_request);
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
    
          let response = await affiliateMessageServices.deleteOne({ _id, user: user._id });
          console.log("response::",response);
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
  
        const deletedMessage = await affiliateMessageServices.deleteOnePermanent({ _id, user: user._id });
        // console.log("deletedMessage::"+deletedMessage);
        return res.success(deletedMessage);
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

};
