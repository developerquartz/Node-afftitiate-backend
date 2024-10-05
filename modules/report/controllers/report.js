const productClickservices = require('../services');
const affiliateProgramTable = require('../../../models/affiliateProgramTable');
const productsTable = require('../../../models/productsTable');
const productClickTable = require('../../../models/productClickTable');
const affiliateSaleTable = require('../../../models/affiliateSaleTable');

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');

module.exports = {

// Reports

ProductClickReport: async (req, res) => {
    try {
      const user = req.user;
      const query = { user: user._id };

    // Apply date filter
    if (req.query.startDate || req.query.endDate) {
        const startDate = new Date(req.query.startDate+'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate+'T23:59:59.999Z');
        query.date_created_utc = {};
        if (startDate) {
            query.date_created_utc.$gte = new Date(startDate);
        }
        if (endDate) {
            query.date_created_utc.$lte = new Date(endDate);
        }
    }

        // Fetch the product IDs associated with the user 
      const productIds = await affiliateProgramTable.find(query)
      .select('products')
      .lean(); // Use lean() for performance if you only need plain JavaScript objects
    
      console.log("productIds",productIds)
      // Extract and flatten the products arrays into one array
      const allProductIds = productIds
      .map(entry => entry.products) // Get the products arrays
      .flat(); // Flatten the array of arrays into a single array

      // Remove duplicates using Set
      // const uniqueProductIds = [...new Set(allProductIds)]; // option not working
      
      // const uniqueProductIds = allProductIds.filter((productId, index, self) => 
      //   index === self.findIndex((id) => id.toString() === productId.toString())
      // );  // 2 option working

        const uniqueProductIds = allProductIds.reduce((acc, current) => {
            if (current) {
                const currentId = current.toString();
                if (!acc.some(id => id.toString() === currentId)) {
                    acc.push(current);
                }
            }
            return acc; // Ensure the accumulator is always returned
        }, []);      // 3 option working

    //   return res.success(uniqueProductIds);

      const result = await productsTable.aggregate([
        // Match the products with IDs in the uniqueProductIds array
        {
            $match: {
                _id: { $in: uniqueProductIds.map(id =>new mongoose.Types.ObjectId(id)) }
            }
        },
        {
        $lookup: {
        from: "files",
        let: { featured_image_id: "$featured_image" },
        pipeline: [
            {
            $match: {
            $expr: { $eq: ["$_id", "$$featured_image_id"] }
            }
            },
            {
            $project: {
            _id: 0, // Hide the _id field
            link: 1 // Include only the link field
            }
            }
        ],
        as: "featured_image_details"
        }
        },
        // Lookup to join with productClickTable and count clicks
        {
            $lookup: {
                from: 'productclicks', // The collection name for productClickTable
                localField: '_id', // The _id field from Product
                foreignField: 'product', // The product field in productClickTable
                as: 'clicks' // Alias for the joined data
            }
        },
        // Unwind the clicks array
        {
            $unwind: {
                path: '$clicks',
                preserveNullAndEmptyArrays: true // Keeps products with zero clicks
            }
        },
        // Group by product and count clicks
        {
            $group: {
                _id: '$_id',
                name: { $first: '$name' }, // Assuming 'name' is a field in Product schema
                clickCount: { $sum: 1 }, // Count the number of clicks
                productDetails: { $first: '$$ROOT' } // Keep the product details
            }
        },
        // Replace the root document with the productDetails and include clickCount
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: ["$productDetails", { clickCount: "$clickCount" }]
                }
            }
        },
        // Optionally sort by click count or other fields
        {
            $sort: { clickCount: -1 }
        }
      ]);

      return res.success(result);

    } catch (error) {
        console.error(error);
        return res.error(error);
    }
},

TotalCommissionReport: async (req, res) => {
    try {
        const user = req.user;
        const query = { user: user._id };

        // Aggregate to sum the commission values
        const result = await affiliateSaleTable.aggregate([
            { $match: query }, // Match the records based on the query
            { 
                $group: { 
                    _id: null, 
                    totalCommission: { $sum: "$commission" }, // Sum the commission values
                    totalRecords: { $sum: 1 } // Count the number of records
                } 
            }
        ]);

        if(result.length === 0){
            return res.error('No any sale is found.',result);
        }
        else{
            return res.success(result);
        }
    } catch (error) {
        console.error(error);
        return res.error(error);
    }
},


// Charts
 ProductSaleChart: async (req, res) => {
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
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } // Sum the commission values
            };
            projectStage = {
                _id: 0,
                year: "$_id",
                count: 1,
                totalCommission: 1
            };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" }
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } // Sum the commission values
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month", // Add numeric month for sorting
                count: 1,
                totalCommission: 1
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
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } // Sum the commission values
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
                count: 1,
                totalCommission: 1
            };

            period = 'week';
        }

        const aggregationPipeline = [
            { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } }, // Filter by date range
            { $group: groupStage }, // Group by year/month/day depending on daysBetween
            { $project: projectStage }, // Project the required fields
            { $sort: period === 'month' ? { numericMonth: 1 } : { toTime:1, year:1 } } // Sort by numeric month if period is month
        ];

        const results = await affiliateSaleTable.aggregate(aggregationPipeline).exec();

        // Total count of records in the range
        const totalRecords = await affiliateSaleTable.countDocuments({
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

ProductCommissionChart: async (req, res) => {
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
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } // Sum the commission values
            };
            projectStage = {
                _id: 0,
                year: "$_id",
                count: 1,
                totalCommission: 1
            };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" }
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } // Sum the commission values
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month", // Add numeric month for sorting
                count: 1,
                totalCommission: 1
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
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } // Sum the commission values
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
                count: 1,
                totalCommission: 1
            };

            period = 'week';
        }

        const aggregationPipeline = [
            { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } }, // Filter by date range
            { $group: groupStage }, // Group by year/month/day depending on daysBetween
            { $project: projectStage }, // Project the required fields
            { $sort: period === 'month' ? { numericMonth: 1 } : { toTime : 1, year:1 } } // Sort by numeric month if period is month
        ];

        const results = await affiliateSaleTable.aggregate(aggregationPipeline).exec();

        // Total count of records in the range
        const totalRecords = await affiliateSaleTable.countDocuments({
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

/* SingleProductCommissionChart: async (req, res) => {
    try {
        const user = req.user;
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
        let productId = new mongoose.Types.ObjectId(req.params._id);
        const query = { user: user._id, product: productId, status: { $ne: "archived" } };

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
                _id: { year: { $year: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                count: 1,
                totalCommission: 1
            };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month",
                count: 1,
                totalCommission: 1
            };
            period = 'month';
        } else {
            // Group by day
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" },
                    day: { $dayOfMonth: "$date_created_utc" },
                    dayOfWeek: { $dayOfWeek: "$date_created_utc" }, // Add dayOfWeek here
                    product: "$product"
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                date: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }] },
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
                count: 1,
                totalCommission: 1
            };
            period = 'day';
        }
        

        const aggregationPipeline = [
            { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } },
            { $group: groupStage },
            { $lookup: {
                from: 'productclicks',
                let: { product_id: "$_id.product", year: "$_id.year", month: "$_id.month", day: "$_id.day" },
                pipeline: [
                    { 
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$product", "$$product_id"] },
                                    { $gte: ["$date_created_utc", { $dateFromParts: { year: "$$year", month: "$$month", day: "$$day" } }] },
                                    { $lt: ["$date_created_utc", { $dateFromParts: { year: { $add: ["$$year", 0] }, month: { $add: ["$$month", 0] }, day: { $add: ["$$day", 1] } } }] }
                                ]
                            }
                        }
                    },
                    { $count: "clickCount" }
                ],
                as: 'clicks'
            }},
            { $addFields: {
                clickCount: { $ifNull: [{ $arrayElemAt: ["$clicks.clickCount", 0] }, 0] }
            }},
            { $project: { ...projectStage, clickCount: 1 } },
            { $sort: period === 'month' ? { numericMonth: 1 } : { date: 1, year: 1 } }
        ];
        
        let results=[];
        results = await affiliateSaleTable.aggregate(aggregationPipeline).exec();

        // Total count of records in the range
        const totalRecords = await affiliateSaleTable.countDocuments({
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
}, */
/* SingleProductCommissionChart: async (req, res) => {
    try {
        const user = req.user;
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
        let productId = new mongoose.Types.ObjectId(req.params._id);
        const query = { user: user._id, product: productId, status: { $ne: "archived" } };

        // Calculate the difference in time (in milliseconds)
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert time difference to days

        console.log('Number of days between the two dates:', daysBetween);

        let groupStage;
        let period;
        let projectStage = {};

        if (daysBetween > 365) {
            // Group by year
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                count: 1,
                totalCommission: 1
            };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month",
                count: 1,
                totalCommission: 1
            };
            period = 'month';
        } else if (daysBetween > 7 && daysBetween <= 31) {
            // Group by week
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, week: { $isoWeek: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                week: "$_id.week",
                count: 1,
                totalCommission: 1
            };
            period = 'week';
        } else {
            // Group by day
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" },
                    day: { $dayOfMonth: "$date_created_utc" },
                    dayOfWeek: { $dayOfWeek: "$date_created_utc" },
                    product: "$product"
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                date: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }] },
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
                count: 1,
                totalCommission: 1
            };
            period = 'day';
        }

        const aggregationPipeline = [
            { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } },
            { $group: groupStage },
            {
                $lookup: {
                    from: 'productclicks',
                    let: { product_id: "$_id.product", year: "$_id.year", month: "$_id.month", day: "$_id.day" },
                    pipeline: [
                        {
                            $addFields: {
                                startDate: {
                                    $cond: {
                                        if: { $and: [{ $gte: ["$$day", 1] }, { $ne: ["$$day", null] }] },
                                        then: { $dateFromParts: { year: "$$year", month: "$$month", day: "$$day" } },
                                        else: { $dateFromParts: { year: "$$year", month: "$$month", day: 1 } }
                                    }
                                },
                                endDate: {
                                    $cond: {
                                        if: { $and: [{ $gte: ["$$day", 1] }, { $ne: ["$$day", null] }] },
                                        then: { $dateFromParts: { year: "$$year", month: "$$month", day: { $add: ["$$day", 1] } } },
                                        else: {
                                            $cond: {
                                                if: { $ne: ["$$month", 12] },
                                                then: { $dateFromParts: { year: "$$year", month: { $add: ["$$month", 1] }, day: 1 } },
                                                else: { $dateFromParts: { year: { $add: ["$$year", 1] }, month: 1, day: 1 } }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$product", "$$product_id"] },
                                        { $gte: ["$date_created_utc", "$startDate"] },
                                        { $lt: ["$date_created_utc", "$endDate"] }
                                    ]
                                }
                            }
                        },
                        { $count: "clickCount" }
                    ],
                    as: 'clicks'
                }
            },
            { $addFields: { clickCount: { $ifNull: [{ $arrayElemAt: ["$clicks.clickCount", 0] }, 0] } } },
            { $project: { ...projectStage, clickCount: 1 } },
            { $sort: period === 'month' ? { numericMonth: 1 } : { date: 1, year: 1, week: 1 } }
        ];

        let results = [];
        results = await affiliateSaleTable.aggregate(aggregationPipeline).exec();

        // Total count of records in the range
        const totalRecords = await affiliateSaleTable.countDocuments({
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
}, */
SingleProductCommissionChart: async (req, res) => {
    try {
        const user = req.user;
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
        let productId = new mongoose.Types.ObjectId(req.params._id);
        const query = { user: user._id, product: productId, status: { $ne: "archived" } };

        // Calculate the time difference in days
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        // Group stages and period selection logic
        let groupStage;
        let projectStage = {};
        let period;

        // Period selection based on daysBetween
        if (daysBetween > 365) {
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                count: 1,
                totalCommission: 1
            };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, product: "$product" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                count: 1,
                totalCommission: 1
            };
            period = 'month';
        } else {
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" },
                    day: { $dayOfMonth: "$date_created_utc" },
                    product: "$product"
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                date: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }] },
                toTime: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: "$_id.day" } }, // Exact date
                count: 1,
                totalCommission: 1
            };
            period = 'day';
        }

        // Aggregate pipeline for AffiliateSales
        const salesPipeline = [
            { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } },
            { $group: groupStage },
            { $project: projectStage },
            { $sort: { "toTime": 1 } }
        ];

        const salesResults = await affiliateSaleTable.aggregate(salesPipeline).exec();

        // Aggregate pipeline for ProductClicks
        const clicksPipeline = [
            { $match: { ...query, date_created_utc: { $gte: startDate, $lte: endDate } } },
            { $sort: { date_created_utc: 1 } }, // Sort by date_created_utc ascending
            { $group: { _id: null, totalClicks: { $sum: "$ProductClicK" } } },
            { $project: { _id: 0, totalClicks: 1 } }
        ];

        const clickResults = await productClickTable.aggregate(clicksPipeline).exec();
        const totalClicks = clickResults.length > 0 ? clickResults[0].totalClicks : 0;

        // Total count of records (sales) in the range
        const totalRecords = await affiliateSaleTable.countDocuments({
            ...query,
            date_created_utc: { $gte: startDate, $lte: endDate }
        });

        const totalCommission = salesResults.reduce((acc, record) => acc + record.totalCommission, 0);
        const totalSales = salesResults.length;

        const data = {
            groupedRecords: salesResults,
            totalSales,
            totalClicks,
            totalCommission,
            period
        };

        return res.success(data);

    } catch (error) {
        console.error(error);
        return res.error(error);
    }
},


SingleProductClickChart: async (req, res) => {
    try {
        const user = req.user;  // User making the request
        const productId = req.params._id;  // ID of the product
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Common query for filtering by product and date range
        const query = {
            product: new mongoose.Types.ObjectId(productId),
            date_created_utc: { $gte: startDate, $lte: endDate },
            status: { $ne: "archived" }  // Exclude archived entries
        };

        // Calculate the number of days between the start and end dates
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        let groupStage, projectStage = {};

        if (daysBetween > 365) {
            // Group by year
            groupStage = {
                _id: { $year: "$date_created_utc" },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = { 
                _id: 0, 
                year: "$_id", 
                totalClicks: 1 
            };
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { 
                    $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] 
                },
                totalClicks: 1
            };
        } else {
            // Group by day
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, day: { $dayOfMonth: "$date_created_utc" }, dayOfWeek: { $dayOfWeek: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                date: { 
                    $concat: [
                        { $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }
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
                totalClicks: 1
            };
        }

        // Aggregate the data
        const result = await productClickTable.aggregate([
            { $match: query },
            { $group: groupStage },
            { $project: projectStage },
            { $sort: { "toTime": 1 } }
        ]);

        // Calculate total clicks across all periods
        const totalClicks = result.reduce((sum, data) => sum + data.totalClicks, 0);

        // Send response with the aggregated result and total clicks
        // res.status(200).json({ success: true, data: result, totalClicks });

        // const data = {
        //     result,
        //     totalClicks,
        // };

        return res.success(result);

    } catch (error) {
        console.error("Error generating Single Product Click Chart:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
},



// Listing
// ProductClickSaleListing: async (req, res) => {
//     try {
//         const user = req.user;
//         const query = { user: user._id };

//         const page = req.query.page;
//         const records = req.query.records;
//         const search = req.query.search;
//         console.log("page:"+page+", records:"+records);

//         const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
//         const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

//         // Step 1: Get all products in the user's affiliate program
//         const affiliatePrograms = await affiliateProgramTable.find({ user: user._id })
//             .select('products')
//             .lean();

//         const allProductIdss = affiliatePrograms.flatMap(program => program.products); // Extract all product IDs

//         // Step 2: Aggregation pipeline with $lookup to include products with or without sales
//         const results = await productsTable.aggregate([
//             {
//                 $match: { 
//                     _id: { $in: allProductIdss }, // Match all products from affiliate programs
//                     // ...dateFilter,
//                     ...(search && {
//                         $or: [
//                             { name: { $regex: search, $options: "i" } },
//                             { description: { $regex: search, $options: "i" } }
//                         ]
//                     })
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'affiliatesales', // Join with AffiliateSale table
//                     let: { productId: '$_id' },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: { $and: [
//                                     { $eq: ['$product', '$$productId'] }, // Match the product ID
//                                     { $eq: ['$user', user._id] }, // Match the user
//                                     { $gte: ['$date_created_utc', startDate] }, // Filter by start date
//                                     { $lte: ['$date_created_utc', endDate] }, // Filter by end date
//                                     { $ne: ['$status', 'archived'] } // Exclude archived sales
//                                 ]}
//                             }
//                         },
//                         {
//                             $group: {
//                                 _id: '$product', // Group by product ID
//                                 totalCommission: { $sum: '$commission' } // Sum the total commission
//                             }
//                         }
//                     ],
//                     as: 'salesData'
//                 }
//             },
//             {
//                 $addFields: {
//                     totalCommission: { 
//                         $ifNull: [{ $arrayElemAt: ['$salesData.totalCommission', 0] }, 0] // Default commission to 0 if no sales
//                     }
//                 }
//             },
//             {
//                 $sort: { totalCommission: -1 } // Sort by total commission
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     productId: '$_id',
//                     totalCommission: 1,
//                     productDetails: 1 // Include product details if needed
//                 }
//             }
//         ]).exec();

//         // Extract all productIds into an array, including those with null or 0 commission
//         const productIds = results.map(item => item.productId);

//         // console.log(productIds);


//         // res.success({
//         //     productCommissions: results
//         // });





  
//       // Apply date filter
//       /* if (req.query.startDate || req.query.endDate) {
//           const startDate = new Date(req.query.startDate+'T00:00:00.000Z');
//           const endDate = new Date(req.query.endDate+'T23:59:59.999Z');
//           query.date_created_utc = {};
//           if (startDate) {
//               query.date_created_utc.$gte = new Date(startDate);
//           }
//           if (endDate) {
//               query.date_created_utc.$lte = new Date(endDate);
//           }
//       }
  
//           // Fetch the product IDs associated with the user 
//         const productIds = await affiliateProgramTable.find(query)
//         .select('products')
//         .lean(); */ // Use lean() for performance if you only need plain JavaScript objects
      
//         // console.log("productIds",productIds)
//         // Extract and flatten the products arrays into one array
//         // const allProductIds = productIds
//         // .map(entry => entry.products) // Get the products arrays
//         // .flat(); // Flatten the array of arrays into a single array
        
//         // console.log("allProductIds",allProductIds);

//         // Remove duplicates using Set
//         // const uniqueProductIds = [...new Set(allProductIds)]; // option not working
        
//         // const uniqueProductIds = allProductIds.filter((productId, index, self) => 
//         //   index === self.findIndex((id) => id.toString() === productId.toString())
//         // );  // 2 option working
  
//           const uniqueProductIds = productIds.reduce((acc, current) => {
//               if (current) {
//                   const currentId = current.toString();
//                   if (!acc.some(id => id.toString() === currentId)) {
//                       acc.push(current);
//                   }
//               }
//               return acc; // Ensure the accumulator is always returned
//           }, []);      // 3 option working
            
//             let selectedProductIds;
//             if(page == 1){
//                 selectedProductIds = uniqueProductIds.slice(0, records);
//             }
//             else{
//                 let start=(page*records)-records;
//                 let end=(page*records);
//                 console.log("start:"+start+"end:"+end);
//                 selectedProductIds = uniqueProductIds.slice(start, end);
//             }

//             // console.log(selectedProductIds); // This will log the first 10 unique product IDs
//         // return res.success(productIds);
  
//       const result = await productsTable.aggregate([
//         // Match the products with IDs in the uniqueProductIds array
//         {
//             $match: {
//                 // _id: { $in: uniqueProductIds.map(id => new mongoose.Types.ObjectId(id)) }
//                 _id: { $in: selectedProductIds.map(id => new mongoose.Types.ObjectId(id)) }
//             }
//         },
//         {
//             $lookup: {
//                 from: "files",
//                 let: { featured_image_id: "$featured_image" },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: { $eq: ["$_id", "$$featured_image_id"] }
//                         }
//                     },
//                     {
//                         $project: {
//                             _id: 0, // Hide the _id field
//                             link: 1 // Include only the link field
//                         }
//                     }
//                 ],
//                 as: "featured_image_details"
//             }
//         },
//         // Lookup to join with productClickTable and count clicks
//         {
//             $lookup: {
//                 from: 'productclicks', // The collection name for productClickTable
//                 localField: '_id', // The _id field from Product
//                 foreignField: 'product', // The product field in productClickTable
//                 as: 'clicks' // Alias for the joined data
//             }
//         },
//         // Lookup to join with affiliatesales and get sales data
//         {
//             $lookup: {
//                 from: 'affiliatesales', // The collection name for affiliatesales
//                 localField: '_id', // The _id field from Product
//                 foreignField: 'product', // The product field in affiliatesales
//                 as: 'sales' // Alias for the joined data
//             }
//         },
//         // Add fields for saleCount and totalCommission
//         {
//             $addFields: {
//                 clickCount: { $size: "$clicks" }, // Count the number of sales
//                 saleCount: { $size: "$sales" }, // Count the number of sales
//                 totalCommission: { $sum: "$sales.commission" } // Sum the commissions from sales
//             }
//         },
//         // Group by product and retain all details
//         {
//             $group: {
//                 _id: '$_id',
//                 name: { $first: '$name' }, // Assuming 'name' is a field in Product schema
//                 // clickCount: { $first: '$clickCount' }, // Retain the clickCount
//                 saleCount: { $first: '$saleCount' }, // Retain the saleCount
//                 totalCommission: { $first: '$totalCommission' }, // Retain the totalCommission
//                 productDetails: { $first: '$$ROOT' } // Keep the product details
//             }
//         },
//         // Replace the root document with the productDetails and include clickCount, saleCount, and totalCommission
//         {
//             $replaceRoot: {
//                 newRoot: {
//                     $mergeObjects: [
//                         "$productDetails", 
//                         { 
//                             clickCount: "$clickCount", 
//                             saleCount: "$saleCount", 
//                             totalCommission: "$totalCommission"
//                         }
//                     ]
//                 }
//             }
//         },
//         // Optionally sort by total commission or other fields
//         {
//             $sort: { totalCommission: -1 }
//         }
//     ]);
    
    
    
//         // Adding the count of uniqueProductIds to the result
//         const response = {
//             totalUniqueProductCount: uniqueProductIds.length, // Add the count of uniqueProductIds
//             result: result // Include the aggregation result
//         };
//         return res.success(response);
  
//       } catch (error) {
//           console.error(error);
//           return res.error(error);
//       }
// },

ProductClickSaleListing: async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const records = parseInt(req.query.records) || 10;
        const search = req.query.search || "";
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Step 1: Get all products in the user's affiliate program
        const affiliatePrograms = await affiliateProgramTable.find({ user: user._id })
            .select('products')
            .lean();

        const allProductIdss = affiliatePrograms.flatMap(program => program.products); // Extract all product IDs

        // Step 2: Aggregation pipeline with $lookup to include products with or without sales
        const results = await productsTable.aggregate([
            {
                $match: { 
                    _id: { $in: allProductIdss }, // Match all products from affiliate programs
                    ...(search && {
                        $or: [
                            { name: { $regex: search, $options: "i" } },
                            { description: { $regex: search, $options: "i" } }
                        ]
                    })
                }
            },
            {
                $lookup: {
                    from: 'affiliatesales', // Join with AffiliateSale table
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [
                                    { $eq: ['$product', '$$productId'] }, // Match the product ID
                                    { $eq: ['$user', user._id] }, // Match the user
                                    { $gte: ['$date_created_utc', startDate] }, // Filter by start date
                                    { $lte: ['$date_created_utc', endDate] }, // Filter by end date
                                    { $ne: ['$status', 'archived'] } // Exclude archived sales
                                ]}
                            }
                        },
                        {
                            $group: {
                                _id: '$product', // Group by product ID
                                totalCommission: { $sum: '$commission' } // Sum the total commission
                            }
                        }
                    ],
                    as: 'salesData'
                }
            },
            {
                $addFields: {
                    totalCommission: { 
                        $ifNull: [{ $arrayElemAt: ['$salesData.totalCommission', 0] }, 0] // Default commission to 0 if no sales
                    }
                }
            },
            {
                $lookup: {
                    from: 'productclicks', // Join with productClickTable
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $and: [
                                    { $eq: ['$product', '$$productId'] }, // Match the product ID
                                    { $gte: ['$date_created_utc', startDate] }, // Filter by start date
                                    { $lte: ['$date_created_utc', endDate] }, // Filter by end date
                                    { $ne: ['$status', 'archived'] } // Exclude archived clicks
                                ]}
                            }
                        },
                        {
                            $group: {
                                _id: '$product', // Group by product ID
                                clickCount: { $sum: '$ProductClicK' } // Sum the clicks
                            }
                        }
                    ],
                    as: 'clicksData'
                }
            },
            {
                $addFields: {
                    clickCount: { 
                        $ifNull: [{ $arrayElemAt: ['$clicksData.clickCount', 0] }, 0] // Default click count to 0 if no clicks
                    }
                }
            },
            {
                $sort: { totalCommission: -1 } // Sort by total commission
            },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    totalCommission: 1,
                    clickCount: 1,
                    productDetails: 1 // Include product details if needed
                }
            }
        ]).exec();

        // Extract all productIds into an array, including those with null or 0 commission
        const productIds = results.map(item => item.productId);
        const uniqueProductIds = [...new Set(productIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));

        let selectedProductIds;
        if(page === 1){
            selectedProductIds = uniqueProductIds.slice(0, records);
        } else {
            const start = (page * records) - records;
            const end = (page * records);
            selectedProductIds = uniqueProductIds.slice(start, end);
        }

        // Final query to get product details
        const finalResults = await productsTable.aggregate([
            {
                $match: { 
                    _id: { $in: selectedProductIds }
                }
            },
            {
                $lookup: {
                    from: "files",
                    let: { featured_image_id: "$featured_image" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$featured_image_id"] }
                            }
                        },
                        {
                            $project: {
                                _id: 0, // Hide the _id field
                                link: 1 // Include only the link field
                            }
                        }
                    ],
                    as: "featured_image_details"
                }
            },
            {
                $lookup: {
                    from: 'productclicks', // The collection name for productClickTable
                    localField: '_id', // The _id field from Product
                    foreignField: 'product', // The product field in productClickTable
                    as: 'clicks' // Alias for the joined data
                }
            },
            {
                $lookup: {
                    from: 'affiliatesales', // The collection name for affiliatesales
                    localField: '_id', // The _id field from Product
                    foreignField: 'product', // The product field in affiliatesales
                    as: 'sales' // Alias for the joined data
                }
            },
            {
                $addFields: {
                    clickCount: { $size: "$clicks" }, // Count the number of clicks
                    saleCount: { $size: "$sales" }, // Count the number of sales
                    totalCommission: { $sum: "$sales.commission" } // Sum the commissions from sales
                }
            },
            {
                $group: {
                    _id: '$_id',
                    name: { $first: '$name' }, // Assuming 'name' is a field in Product schema
                    clickCount: { $first: '$clickCount' }, // Retain the clickCount
                    saleCount: { $first: '$saleCount' }, // Retain the saleCount
                    totalCommission: { $first: '$totalCommission' }, // Retain the totalCommission
                    productDetails: { $first: '$$ROOT' } // Keep the product details
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            "$productDetails", 
                            { 
                                clickCount: "$clickCount", 
                                saleCount: "$saleCount", 
                                totalCommission: "$totalCommission"
                            }
                        ]
                    }
                }
            },
            {
                $sort: { totalCommission: -1 } // Sort by total commission
            }
        ]);

        // Adding the count of uniqueProductIds to the result
        const response = {
            totalUniqueProductCount: uniqueProductIds.length, // Add the count of uniqueProductIds
            result: finalResults // Include the aggregation result
        };

        return res.success(response);

    } catch (error) {
        console.error(error);
        return res.error(error);
    }
},



SingleProductClickSaleListing: async (req, res) => {
    try {
        const user = req.user;
        const query = { user: user._id };
        let productId = req.params._id;

        const uniqueProductIds = []; // Initialize the array
        // Now you can push elements into the array
        uniqueProductIds.push(new mongoose.Types.ObjectId(productId));
        
        const result = await productsTable.aggregate([
            // Match the products with IDs in the uniqueProductIds array
            {
                $match: {
                    _id: { $in: uniqueProductIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $lookup: {
                    from: "files",
                    let: { featured_image_id: "$featured_image" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$featured_image_id"] }
                            }
                        },
                        {
                            $project: {
                                _id: 0, // Hide the _id field
                                link: 1 // Include only the link field
                            }
                        }
                    ],
                    as: "featured_image_details"
                }
            },
            // Lookup to join with productClickTable and count clicks
            {
                $lookup: {
                    from: 'productclicks', // The collection name for productClickTable
                    localField: '_id', // The _id field from Product
                    foreignField: 'product', // The product field in productClickTable
                    as: 'clicks' // Alias for the joined data
                }
            },
            // Group by product and count sales
            {
                $addFields: {
                    clickCount: { $size: "$clicks" } // Count the number of sales directly
                }
            },
            // Unwind the clicks array
            {
                $unwind: {
                    path: '$clicks',
                    preserveNullAndEmptyArrays: true // Keeps products with zero clicks
                }
            },
            // Group by product and count clicks
            {
                $group: {
                    _id: '$_id',
                    name: { $first: '$name' }, // Assuming 'name' is a field in Product schema
                    // clickCount: { $sum: 1 }, // Count the number of clicks
                    productDetails: { $first: '$$ROOT' } // Keep the product details
                }
            },
            // Replace the root document with the productDetails and include clickCount
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$productDetails", { clickCount: "$clickCount" }]
                    }
                }
            },
            // Optionally sort by click count or other fields
            {
                $sort: { clickCount: -1 }
            },
        
            // Lookup to join with affiliatesales and count sales
            {
                $lookup: {
                    from: 'affiliatesales', // The collection name for affiliatesales
                    localField: '_id', // The _id field from Product
                    foreignField: 'product', // The product field in affiliatesales
                    as: 'sales' // Alias for the joined data
                }
            },
            // Group by product and count sales
            {
                $addFields: {
                    saleCount: { $size: "$sales" } // Count the number of sales directly
                }
            },
            // Optionally sort by sale count or other fields
            {
                $sort: { saleCount: -1 }
            },
        ]);
    
    
  
        return res.success(result);
  
      } catch (error) {
          console.error(error);
          return res.error(error);
      }
},

/* AffiliateProgramClickSaleListing: async (req, res) => {
    try {
        const user = req.user;
        const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "", fromDate, toDate } = req.query;

        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip);
        const orderNum = parseInt(order);

        // Set the date filters for the query
        const startDate = fromDate ? new Date(fromDate + 'T00:00:00.000Z') : null;
        const endDate = toDate ? new Date(toDate + 'T23:59:59.999Z') : null;

        const dateFilter = startDate && endDate ? {
            date_created_utc: { $gte: startDate, $lte: endDate }
        } : {};

        const query = {
            user: new mongoose.Types.ObjectId(user._id),
            status: { $ne: "archived" },
            ...dateFilter,
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ]
            })
        };

        const items = await affiliateProgramTable.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "productclicks",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalClicks: { $sum: "$ProductClicK" }
                            }
                        }
                    ],
                    as: "clickStats"
                }
            },
            {
                $lookup: {
                    from: "affiliatesales",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCommission: { $sum: "$commission" }
                            }
                        }
                    ],
                    as: "commissionStats"
                }
            },
            {
                $addFields: {
                    totalClicks: { $ifNull: [{ $arrayElemAt: ["$clickStats.totalClicks", 0] }, 0] },
                    totalCommission: { $ifNull: [{ $arrayElemAt: ["$commissionStats.totalCommission", 0] }, 0] }
                }
            },
            {
                $sort: { [orderBy]: orderNum }
            },
            {
                $skip: (skipNum - 1) * limitNum
            },
            {
                $limit: limitNum
            }
        ]);

        // Count total number of documents matching the query
        const total = await affiliateProgramTable.countDocuments(query);

        // Return the paginated response
        return res.success(req.nextPageOptions(items, total));
    } catch (error) {
        console.error(error);
        res.error(error);
    }
}, */

AffiliateProgramClickSaleListing: async (req, res) => {
    try {
        /* const user = req.user;
        const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "", fromDate, toDate } = req.query;

        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip);
        const orderNum = parseInt(order);

        // Set the date filters for the query
        const startDate = fromDate ? new Date(fromDate + 'T00:00:00.000Z') : null;
        const endDate = toDate ? new Date(toDate + 'T23:59:59.999Z') : null;

        const dateFilter = startDate && endDate ? {
            date_created_utc: { $gte: startDate, $lte: endDate }
        } : {};

        const query = {
            user: new mongoose.Types.ObjectId(user._id),
            status: { $ne: "archived" },
            ...dateFilter,
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ]
            })
        };

        // query.date_created_utc = {};
        // if (startDate) {
        //     query.date_created_utc.$gte = new Date(startDate);
        // }
        // if (endDate) {
        //     query.date_created_utc.$lte = new Date(endDate);
        // }

        // Apply date filter
        // if (req.query.startDate || req.query.endDate) {
        //     const startDate = new Date(req.query.startDate+'T00:00:00.000Z');
        //     const endDate = new Date(req.query.endDate+'T23:59:59.999Z');
        //     query.date_created_utc = {};
        //     if (startDate) {
        //         query.date_created_utc.$gte = new Date(startDate);
        //     }
        //     if (endDate) {
        //         query.date_created_utc.$lte = new Date(endDate);
        //     }
        // }

        const items = await affiliateProgramTable.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "productclicks",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalClicks: { $sum: "$ProductClicK" }
                            }
                        }
                    ],
                    as: "clickStats"
                }
            },
            {
                $lookup: {
                    from: "affiliatesales",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                },
                                ...dateFilter // Add date filter to sales lookup
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCommission: { $sum: "$commission" },
                                saleCount: { $sum: 1 } // Count the number of sales
                            }
                        }
                    ],
                    as: "commissionStats"
                }
            },
            {
                $addFields: {
                    totalClicks: { $ifNull: [{ $arrayElemAt: ["$clickStats.totalClicks", 0] }, 0] },
                    totalCommission: { $ifNull: [{ $arrayElemAt: ["$commissionStats.totalCommission", 0] }, 0] },
                    saleCount: { $ifNull: [{ $arrayElemAt: ["$commissionStats.saleCount", 0] }, 0] }
                }
            },
            {
                $sort: { [orderBy]: orderNum }
            },
            {
                $skip: (skipNum - 1) * limitNum
            },
            {
                $limit: limitNum
            }
        ]);

        // Count total number of documents matching the query
        const total = await affiliateProgramTable.countDocuments(query);

        // Return the paginated response
        return res.success(req.nextPageOptions(items, total)); */

        const user = req.user;
        const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "", fromDate, toDate } = req.query;

        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip);
        const orderNum = parseInt(order);

        // Set the date filters for the query
        const startDate = fromDate ? new Date(fromDate + 'T00:00:00.000Z') : null;
        const endDate = toDate ? new Date(toDate + 'T23:59:59.999Z') : null;

        const dateFilter = startDate && endDate ? {
            date_created_utc: { $gte: startDate, $lte: endDate }
        } : {};

        const query = {
            user: new mongoose.Types.ObjectId(user._id),
            status: { $ne: "archived" },
            ...dateFilter,
            ...(search && {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ]
            })
        };

        const items = await affiliateProgramTable.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "productclicks",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                },
                                ...(startDate && endDate ? { 
                                    date_created_utc: { $gte: startDate, $lte: endDate } 
                                } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalClicks: { $sum: "$ProductClicK" }
                            }
                        }
                    ],
                    as: "clickStats"
                }
            },
            {
                $lookup: {
                    from: "affiliatesales",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                },
                                ...(startDate && endDate ? { 
                                    date_created_utc: { $gte: startDate, $lte: endDate } 
                                } : {})
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCommission: { $sum: "$commission" },
                                saleCount: { $sum: 1 } // Count the number of sales
                            }
                        }
                    ],
                    as: "commissionStats"
                }
            },
            {
                $addFields: {
                    totalClicks: { $ifNull: [{ $arrayElemAt: ["$clickStats.totalClicks", 0] }, 0] },
                    totalCommission: { $ifNull: [{ $arrayElemAt: ["$commissionStats.totalCommission", 0] }, 0] },
                    saleCount: { $ifNull: [{ $arrayElemAt: ["$commissionStats.saleCount", 0] }, 0] }
                }
            },
            {
                $sort: { [orderBy]: orderNum }
            },
            {
                $skip: (skipNum - 1) * limitNum
            },
            {
                $limit: limitNum
            }
        ]);

        // Count total number of documents matching the query
        const total = await affiliateProgramTable.countDocuments(query);

        // Return the paginated response
        return res.success(req.nextPageOptions(items, total));

    } catch (error) {
        console.error(error);
        res.error(error);
    }
},

SingleAffiliateProgramClickSaleListing: async (req, res) => {
    try {
        const user = req.user;
        let affiliateId = new mongoose.Types.ObjectId(req.params._id);
        const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "", fromDate, toDate } = req.query;

        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip);
        const orderNum = parseInt(order);

        // Set the date filters for the query
        const startDate = fromDate ? new Date(fromDate + 'T00:00:00.000Z') : null;
        const endDate = toDate ? new Date(toDate + 'T23:59:59.999Z') : null;

        const dateFilter = startDate && endDate ? {
            date_created_utc: { $gte: startDate, $lte: endDate }
        } : {};

        const query = {
            user: new mongoose.Types.ObjectId(user._id),
            _id: new mongoose.Types.ObjectId(req.params._id),
            status: { $ne: "archived" },
            // ...dateFilter,
            // ...(search && {
            //     $or: [
            //         { name: { $regex: search, $options: "i" } },
            //         { description: { $regex: search, $options: "i" } }
            //     ]
            // })
        };

        const items = await affiliateProgramTable.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "productclicks",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalClicks: { $sum: "$ProductClicK" }
                            }
                        }
                    ],
                    as: "clickStats"
                }
            },
            {
                $lookup: {
                    from: "affiliatesales",
                    let: { affiliateProgramId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$affiliateProgram", "$$affiliateProgramId"]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCommission: { $sum: "$commission" },
                                saleCount: { $sum: 1 } // Count the number of sales
                            }
                        }
                    ],
                    as: "commissionStats"
                }
            },
            {
                $addFields: {
                    totalClicks: { $ifNull: [{ $arrayElemAt: ["$clickStats.totalClicks", 0] }, 0] },
                    totalCommission: { $ifNull: [{ $arrayElemAt: ["$commissionStats.totalCommission", 0] }, 0] },
                    saleCount: { $ifNull: [{ $arrayElemAt: ["$commissionStats.saleCount", 0] }, 0] } // Add sale count
                }
            },
            {
                $sort: { [orderBy]: orderNum }
            },
            {
                $skip: (skipNum - 1) * limitNum
            },
            {
                $limit: limitNum
            }
        ]);

        // Count total number of documents matching the query
        const total = await affiliateProgramTable.countDocuments(query);

        // Return the paginated response
        // return res.success(req.nextPageOptions(items, total));
        return res.success(items);
    } catch (error) {
        console.error(error);
        res.error(error);
    }
},


// test
/* SingleAffiliateProgramSaleListing: async (req, res) => {
    try {
        const user = req.user;
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
        const affiliateProgramId = new mongoose.Types.ObjectId(req.params._id); // Affiliate Program ID from params

        const result = await affiliateProgramTable.aggregate([
            // Match the Affiliate Program
            {
                $match: {
                    _id: affiliateProgramId,
                    user: user._id // Ensure it matches the user
                }
            },
            {
                $lookup: {
                    from: "files",
                    let: { featured_image_id: "$featured_image" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$featured_image_id"] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                link: 1 // Include only the link field for image
                            }
                        }
                    ],
                    as: "featured_image_details"
                }
            },
            // Lookup to join with productClickTable and count clicks in date range
            {
                $lookup: {
                    from: 'productclicks', // The collection name for productClickTable
                    let: { affiliate_program_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$affiliateProgram", "$$affiliate_program_id"] },
                                        { $gte: ["$date_created_utc", startDate] },
                                        { $lte: ["$date_created_utc", endDate] }
                                    ]
                                }
                            }
                        },
                        { $count: "clickCount" } // Count total clicks
                    ],
                    as: 'clicks'
                }
            },
            // Lookup to join with affiliateSaleTable and sum commissions in date range
            {
                $lookup: {
                    from: 'affiliatesales', // The collection name for affiliateSaleTable
                    let: { affiliate_program_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$affiliateProgram", "$$affiliate_program_id"] },
                                        { $gte: ["$date_created_utc", startDate] },
                                        { $lte: ["$date_created_utc", endDate] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCommission: { $sum: "$commission" }, // Sum of all commissions
                                saleCount: { $sum: 1 } // Total number of sales
                            }
                        }
                    ],
                    as: 'sales'
                }
            },
            // Add click count and sales count fields
            {
                $addFields: {
                    clickCount: { $ifNull: [{ $arrayElemAt: ["$clicks.clickCount", 0] }, 0] },
                    totalCommission: { $ifNull: [{ $arrayElemAt: ["$sales.totalCommission", 0] }, 0] },
                    saleCount: { $ifNull: [{ $arrayElemAt: ["$sales.saleCount", 0] }, 0] }
                }
            },
            // Project the required fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    clickCount: 1,
                    totalCommission: 1,
                    saleCount: 1,
                    featured_image_details: 1
                }
            }
        ]);

        return res.success(result);

    } catch (error) {
        console.error(error);
        return res.error(error);
    }
}, */


/* SingleAffiliateProgramSaleListing: async (req, res) => {
    try {
        const user = req.user;
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
        const query = { user: user._id, status: { $ne: "archived" } };

        const affiliateProgmamId = new mongoose.Types.ObjectId(req.params._id);
        console.log(affiliateProgmamId);
        // Calculate the difference in time (in milliseconds)
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        console.log('Number of days between the two dates:', daysBetween);

        let groupStage;
        let projectStage = {};

        if (daysBetween > 365) {
            // Group by year
            groupStage = {
                _id: { $year: "$date_created_utc" },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" } 
            };
            projectStage = {
                _id: 0,
                year: "$_id",
                count: 1,
                totalCommission: 1
            };
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" }
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month",
                count: 1,
                totalCommission: 1
            };
        } else {
            // Group by day
            groupStage = {
                _id: {
                    year: { $year: "$date_created_utc" },
                    month: { $month: "$date_created_utc" },
                    day: { $dayOfMonth: "$date_created_utc" },
                    dayOfWeek: { $dayOfWeek: "$date_created_utc" }
                },
                count: { $sum: 1 },
                totalCommission: { $sum: "$commission" }
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
                count: 1,
                totalCommission: 1
            };
        }

        // Aggregation pipeline
        const results = await affiliateSaleTable.aggregate([
            {
                $match: {
                    user: user._id,
                    affiliateProgram:affiliateProgmamId,
                    date_created_utc: { $gte: startDate, $lte: endDate },
                    status: { $ne: "archived" }
                }
            },
            {
                $group: groupStage
            },
            {
                $lookup: {
                    from: "productclicks", // Assuming ProductClick collection is named productclicks
                    localField: "affiliateProgram", // Match on product ID or date group
                    foreignField: "affiliateProgram", // Assuming ProductClick stores affiliateProgram
                    as: "clickData"
                }
            },
            {
                $addFields: {
                    clickCount: { $size: "$clickData" } // Count the number of clicks
                }
            },
            {
                $project: {
                    ...projectStage,
                    clickCount: 1 // Include clickCount in the result
                }
            },
            {
                $sort: { totalCommission: -1 }
            }
        ]);

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error("Error generating ProductCommissionChart:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}, */

SingleAffiliateProgramSaleChart: async (req, res) => {
    try {
        const user = req.user;  // User making the request
        const affiliateProgramId = req.params._id;  // ID of the affiliate program
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Common query for filtering by user, affiliateProgram, and date range
        const query = {
            affiliateProgram: new mongoose.Types.ObjectId(affiliateProgramId),
            date_created_utc: { $gte: startDate, $lte: endDate },
            status: { $ne: "archived" }  // Exclude archived entries
        };

        // Calculate the number of days between the start and end dates
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        let groupStage, period, projectStage = {};

        if (daysBetween > 365) {
            // Group by year
            groupStage = { _id: { $year: "$date_created_utc" }, count: { $sum: 1 }, totalCommission: { $sum: "$commission" } };
            projectStage = { _id: 0, year: "$_id", count: 1, totalCommission: 1 };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" } },
                count: { $sum: 1 }, totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month",
                count: 1, totalCommission: 1
            };
            period = 'month';
        } else {
            // Group by day
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, day: { $dayOfMonth: "$date_created_utc" }, dayOfWeek: { $dayOfWeek: "$date_created_utc" } },
                count: { $sum: 1 }, totalCommission: { $sum: "$commission" }
            };
            projectStage = {
                _id: 0,
                date: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }] },
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
                count: 1,
                totalCommission: 1
            };
            period = 'day';
        }

        // AffiliateSale aggregation for total commission
        const salesAggregation = await affiliateSaleTable.aggregate([
            { $match: query },
            { $group: groupStage },
            { $project: projectStage },
            // { $sort: { year: 1, numericMonth: 1 } }  // Sort by year and month
            { $sort: { "toTime": 1 } }
        ]);

        // ProductClick aggregation for click counts
        const clicksAggregation = await productClickTable.aggregate([
            { $match: query },
            { $group: { _id: null, clickCount: { $sum: "$ProductClicK" } } }
        ]);

        const clickCount = clicksAggregation[0]?.clickCount || 0;

        // Get sales count from AffiliateSale table
        const salesCountAggregation = await affiliateSaleTable.aggregate([
            { $match: query },
            { $group: { _id: null, salesCount: { $sum: 1 } } }
        ]);

        const salesCount = salesCountAggregation[0]?.salesCount || 0;

        // Combine results and send response
        const data = {
            period:period,
            totalCommission: salesAggregation,
            clickCount:clickCount,
            salesCount:salesCount
        };

        return res.success(data);

    } catch (error) {
        console.error('Error in ProductCommissionChart:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
},

/* SingleAffiliateProgramClickChart: async (req, res) => {
    try {
        const user = req.user;  // User making the request
        const affiliateProgramId = req.params._id;  // ID of the affiliate program
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Common query for filtering by user, affiliateProgram, and date range
        const query = {
            affiliateProgram: new mongoose.Types.ObjectId(affiliateProgramId),
            date_created_utc: { $gte: startDate, $lte: endDate },
            status: { $ne: "archived" }  // Exclude archived entries
        };

        // Calculate the number of days between the start and end dates
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        let groupStage, period, projectStage = {};

        if (daysBetween > 365) {
            // Group by year
            groupStage = { _id: { $year: "$date_created_utc" }, totalClicks: { $sum: "$ProductClicK" } };
            projectStage = { _id: 0, year: "$_id", totalClicks: 1 };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month",
                totalClicks: 1
            };
            period = 'month';
        } else {
            // Group by day
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, day: { $dayOfMonth: "$date_created_utc" }, dayOfWeek: { $dayOfWeek: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                date: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }] },
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
                totalClicks: 1
            };
            period = 'day';
        }

        // Aggregation pipeline for grouping and calculating clicks
        const clickChartPipeline = [
            { $match: query },
            { $group: groupStage },
            { $project: projectStage }
        ];

        // Execute the aggregation to get chart data
        const clickChart = await productClickTable.aggregate(clickChartPipeline).exec();

        // Get total clicks
        const totalClicks = clickChart.reduce((sum, data) => sum + data.totalClicks, 0);

        // Return the result with total clicks and chart data
        const data = {
            clickChart: clickChart,
            totalClicks: totalClicks,
            period
        };
        
        return res.success(data);
        

    } catch (error) {
        res.status(500).json({ success: false, message: "Error generating clicks chart", error: error.message });
    }
}, */
SingleAffiliateProgramClickChart: async (req, res) => {
    try {
        const user = req.user;  // User making the request
        const affiliateProgramId = req.params._id;  // ID of the affiliate program
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Common query for filtering by affiliateProgram and date range
        const query = {
            affiliateProgram: new mongoose.Types.ObjectId(affiliateProgramId),
            date_created_utc: { $gte: startDate, $lte: endDate },
            status: { $ne: "archived" }  // Exclude archived entries
        };

        // Calculate the number of days between the start and end dates
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        let groupStage, period, projectStage = {};

        // Determine grouping based on the date range
        if (daysBetween > 365) {
            // Group by year
            groupStage = { _id: { $year: "$date_created_utc" }, totalClicks: { $sum: "$ProductClicK" } };
            projectStage = { _id: 0, year: "$_id", totalClicks: 1 };
            period = 'year';
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                numericMonth: "$_id.month",
                totalClicks: 1
            };
            period = 'month';
        } else {
            // Group by day
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, day: { $dayOfMonth: "$date_created_utc" }, dayOfWeek: { $dayOfWeek: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                date: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }] },
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
                totalClicks: 1
            };
            period = 'day';
        }

        // Aggregation pipeline
        const clickStats = await productClickTable.aggregate([
            { $match: query },
            { $group: groupStage },
            { $project: projectStage },
            // { $sort: { date_created_utc: 1 } }  // Sort by ascending date
            { $sort: { "toTime": 1 } }
        ]);

        const data = {
            clickStats: clickStats,
            period
        };
        
        return res.success(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
},


SingleProductClickChartNew: async (req, res) => {
    try {
        const user = req.user;  // User making the request
        const productId = req.params._id;  // ID of the product
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Common query for filtering by product and date range
        const query = {
            product: new mongoose.Types.ObjectId(productId),
            date_created_utc: { $gte: startDate, $lte: endDate },
            status: { $ne: "archived" }  // Exclude archived entries
        };

        // Calculate the number of days between the start and end dates
        const timeDifference = endDate.getTime() - startDate.getTime();
        const daysBetween = Math.ceil(timeDifference / (1000 * 3600 * 24));

        let groupStage, projectStage = {};

        if (daysBetween > 365) {
            // Group by year
            groupStage = {
                _id: { $year: "$date_created_utc" },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = { 
                _id: 0, 
                year: "$_id", 
                totalClicks: 1 
            };
        } else if (daysBetween > 31 && daysBetween <= 365) {
            // Group by month
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                year: "$_id.year",
                month: { 
                    $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] 
                },
                totalClicks: 1
            };
        } else {
            // Group by day
            groupStage = {
                _id: { year: { $year: "$date_created_utc" }, month: { $month: "$date_created_utc" }, day: { $dayOfMonth: "$date_created_utc" }, dayOfWeek: { $dayOfWeek: "$date_created_utc" } },
                totalClicks: { $sum: "$ProductClicK" }
            };
            projectStage = {
                _id: 0,
                date: { 
                    $concat: [
                        { $toString: "$_id.year" }, "-", { $toString: "$_id.month" }, "-", { $toString: "$_id.day" }
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
                totalClicks: 1
            };
        }

        // Aggregate the data
        const result = await productClickTable.aggregate([
            { $match: query },
            { $group: groupStage },
            { $project: projectStage },
            { $sort: { "toTime": 1 } }
        ]);

        // Calculate total clicks across all periods
        const totalClicks = result.reduce((sum, data) => sum + data.totalClicks, 0);

        // Send response with the aggregated result and total clicks
        res.status(200).json({ success: true, data: result, totalClicks });
    } catch (error) {
        console.error("Error generating Single Product Click Chart:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
},



};
