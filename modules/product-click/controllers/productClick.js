const productClickservices = require('../services');
const productClickTable = require('../../../models/productClickTable');

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');

module.exports = {
  // Add a new commission request
  add: async (req, res) => {
      try {
          let data = req.body;
          // data.user = req.user._id; 
          // data.status = "active";
          const { date, utcDate } = utils.getDate();
          data.date_created_utc = utcDate;
          data.date_created = date;

          const product_click = await productClickservices.create(data);
        
          return res.success("A new product click enter successfully.", { product_click });
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
        
        let items = await productClickservices.list(query,req, req.paginationOptions);
        let total = await productClickservices.countData(query);

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

        const productClicks = await productClickTable.find(query);
        // res.status(200).json(productClicks);
        return res.success("productClicks", productClicks);
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
      const hasData = await productClickservices.findOne(
        { _id, user: user._id },
        "_id affiliatecomreqs"
      );
  
      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }
  
      let data = req.body;

      // Prepare the data to update
      const setData = {
        user: user._id,
        amount: data.amount,
        paymentIntentId: data.paymentIntentId,
      };


      // Update the Affiliate Program record
      const product_click = await productClickservices.update({ _id }, setData);
    
      return res.success("Affiliate_Program_UPDATED", product_click);
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
    
          let response = await productClickservices.deleteOne({ _id, user: user._id });
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
  
        const deletedCommission = await productClickservices.deleteOnePermanent({ _id, user: user._id });
        // console.log("deletedCommission::"+deletedCommission);
        return res.success(deletedCommission);
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

  // Get a list of all commission requests
  /* ProductClickChart: async (req, res) => {
    try {
        // let query = { status: "active" };
        const user = req.user;
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        const query = { user: user._id, status: { $ne: "archived" } };

        // Convert the string to a Date object
        console.log(`startDate: ${startDate} , endDate: ${endDate} , `);

        // Calculate the difference in time (in milliseconds)
        const timeDifference = endDate.getTime() - startDate.getTime();

        // Convert time difference from milliseconds to days
        const daysDifference = timeDifference / (1000 * 3600 * 24);

        const daysBetween = Math.ceil(daysDifference); // Rounds up to the nearest whole number

        console.log('Number of days between the two dates:', daysBetween);

        if (daysBetween) {
          if (daysBetween > 365) {
            console.log('Year:', daysBetween);
          }
          if(daysBetween > 7 && daysBetween < 365){
            console.log('Month:', daysBetween);
          }
          else if(daysBetween <= 7){
            console.log('Week:', daysBetween);
          }
        }
        
    } catch (error) {
        console.error(error);
        res.error(error);
    }
    
        
        
  }, */ 

  ProductClickChart: async (req, res) => {
    try {
        const user = req.user;
        const startDate = new Date(req.query.startDate+'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate+'T23:59:59.999Z');
        const query = { user: user._id, status: { $ne: "archived" } };

        // Calculate the difference in time (in milliseconds)
        const timeDifference = endDate.getTime() - startDate.getTime();

        // Convert time difference from milliseconds to days
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        console.log('Number of days between the two dates:', daysBetween);

        let groupStage;
let period;
let projectStage = {};

if (daysBetween > 365) {
    // Group by year
    groupStage = {
        _id: { $year: "$date_created_utc" },
        count: { $sum: 1 }
    };
    projectStage = {
        _id: 0,
        year: "$_id",
        count: 1
    };
    period = 'year';
} else if (daysBetween > 31 && daysBetween <= 365) {
    // Group by month
    groupStage = {
        _id: {
            year: { $year: "$date_created_utc" },
            month: { $month: "$date_created_utc" }
        },
        count: { $sum: 1 }
    };
    projectStage = {
        _id: 0,
        year: "$_id.year",
        month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
        numericMonth: "$_id.month", // Add numeric month for sorting
        count: 1
    };
    period = 'month';
} else {
    // Group by day
    groupStage = {
        _id: {
            year: { $year: "$date_created_utc" },
            month: { $month: "$date_created_utc" },
            day: { $dayOfMonth: "$date_created_utc" },
            dayOfWeek: { $dayOfWeek: "$date_created_utc" }
        },
        count: { $sum: 1 }
    };
    projectStage = {
        _id: 0,
        date: {
            $concat: [
                { $toString: "$_id.year" }, "-",
                { $toString: "$_id.month" }, "-",
                { $toString: "$_id.day" }
            ]
        },
        toTime: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: "$_id.day" } }, // Exact date
        dayOfWeek: {
            $switch: {
                branches: [
                    { case: { $eq: ["$_id.dayOfWeek", 1] }, then: "Sunday" },
                    { case: { $eq: ["$_id.dayOfWeek", 2] }, then: "Monday" },
                    { case: { $eq: ["$_id.dayOfWeek", 3] }, then: "Tuesday" },
                    { case: { $eq: ["$_id.dayOfWeek", 4] }, then: "Wednesday" },
                    { case: { $eq: ["$_id.dayOfWeek", 5] }, then: "Thursday" },
                    { case: { $eq: ["$_id.dayOfWeek", 6] }, then: "Friday" },
                    { case: { $eq: ["$_id.dayOfWeek", 7] }, then: "Saturday" }
                ],
                default: "Unknown"
            }
        },
        count: 1
    };

    period = 'week';
}

const aggregationPipeline = [
    { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } }, // Filter by date range
    { $group: groupStage }, // Group by year/month/day depending on daysBetween
    { $project: projectStage }, // Project the required fields
    { $sort: period === 'month' ? { numericMonth: 1 } : { toTime:1, year:1 } } // Sort by numeric month if period is month
];

const results = await productClickTable.aggregate(aggregationPipeline).exec();

// Total count of records in the range
const totalRecords = await productClickTable.countDocuments({
    ...query,
    date_created_utc: { $gte: startDate, $lte: endDate }
});

const data = {
    groupedRecords: results,
    totalRecords: totalRecords,
    period: period
};

return res.success(data);

    } catch (error) {
        console.error(error);
        return res.error(error);
    }
  },



  
};
