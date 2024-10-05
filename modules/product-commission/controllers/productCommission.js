// const AffiliateProgram = require('../../../models/affiliateProgram');
const AffiliateProgramServices = require('../services');
const AffiliateProductComTable = require('../../../models/affiliateProductComTable');
const ProductsTable = require('../../../models/productsTable')

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');


module.exports = {
  // Add a new affiliate program
  add: async (req, res) => {
      try {
          let data = req.body;
          data.user = req.user._id; 
          // data.status = "active";
          const { date, utcDate } = utils.getDate();
          data.date_created_utc = utcDate;
          data.date_created = date;

          const affiliateprogram = await AffiliateProgramServices.create(data);
        
          return res.success("AffiliateProgramAdded", { affiliateprogram });
          } catch (error) {
          console.error(error);
          res.error(error);
          }
  },

  // Get a list of all affiliate programs
  list: async (req, res) => {
    try {
        // let query = { status: "active" };
        const user = req.user;
        const _id = new mongoose.Types.ObjectId(req.params._id);
        const query = { user: user._id};
        // let { category, fieldName, fieldValue } = req.query;

        // if (category) {
        //     query.categories = category;
        // }

        // if (fieldName && fieldValue) {
        //     query[fieldName] = fieldValue;
        // }

        let items = await AffiliateProgramServices.list(query, req.paginationOptions);
        let total = await AffiliateProgramServices.countData(query);

        return res.success(req.nextPageOptions(items, total));
    } catch (error) {
        console.error(error);
        res.error(error);
    }
  },

  // Get a single affiliate program by ID
  view: async (req, res) => {
      try {
          /* const user = req.user;
          const _id = new mongoose.Types.ObjectId(req.params._id);
          const query = { user: user._id, _id};

          const item = await AffiliateProgramServices.findOne(query, "-meta_data");

          if (!item) return res.error("NO_RECORD_FOUND");

          return res.success("RECORD_FOUND", item); */
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

        // Fetch the record with populated product details
        const record = await AffiliateProductComTable.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "products",
                    let: { products: "$products" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ["$_id", "$$products"] }
                            }
                        }
                    ],
                    as: "productDetails"
                }
            }
        ]).exec();

        // Check if record exists
        if (!record || record.length === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        // Return the single record
        return res.json(record[0]); // Since aggregate returns an array, we return the first item
      } catch (error) {
      console.error(error);
      res.error(error);
      }
  },

  // Update an affiliate program by ID
  /* update: async (req, res) => {
      try {
          const updatedaffiliateprogram = await AffiliateProgramServices.findByIdAndUpdate(req.params.id, req.body, { new: true });
          if (!updatedaffiliateprogram) {
              return res.status(404).json({ message: 'Affiliate Program not found' });
          }
          res.status(200).json(updatedaffiliateprogram);
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Error updating affiliate program', error });
      }
  }, */
  update: async (req, res) => {
      /* try {
        let user = req.user;
        let _id = req.params._id;
        const hasData = await AffiliateProgramServices.findOne(
          {
            _id,
            user: user._id,
          },
          "_id"
        );
  
        if (!hasData) {
          return res.error("NO_RECORD_FOUND");
        }
  
        let data = req.body;
  
        const setData = {
          user: user._id,
          name: data.name,
          country: data.country,
          products: data.products,
          image: data.image,
          bio: data.bio,
          description: data.description,
        };
  
        const affiliateprogram = await AffiliateProgramServices.update({ _id }, setData);
  
        return res.success("Affiliate_Program_UPDATED", affiliateprogram);
      } catch (error) {
        console.error(error);
        res.error(error);
      } */

      try {
        let user = req.user;
        let _id = req.params._id;
    
        // Check if the Affiliate Program exists for the user
        const hasData = await AffiliateProgramServices.findOne(
          { _id, user: user._id },
          "_id products"
        );
    
        if (!hasData) {
          return res.error("NO_RECORD_FOUND");
        }
    
        let data = req.body;
    
        // Prepare the data to update
        const setData = {
          user: user._id,
          name: data.name,
          country: data.country,
          products: data.products,
          image: data.image,
          bio: data.bio,
          description: data.description,
        };
    
        // Update the Affiliate Program record
        const affiliateprogram = await AffiliateProgramServices.update({ _id }, setData);
    
        // Get the previous products from the Affiliate Program
        const previousProducts = hasData.products || [];
        const updatedProducts = data.products || [];
    
        // Find products that were removed (de-selected)
        const removedProducts = previousProducts.filter(
          (productId) => !updatedProducts.includes(productId.toString())
        );
    
        // Find products that were added (newly selected)
        const addedProducts = updatedProducts.filter(
          (productId) => !previousProducts.includes(productId.toString())
        );
    
        // Handle removing AffiliateProductComTable records for de-selected products
        if (removedProducts.length > 0) {
          await AffiliateProductComTable.deleteMany({
            _id: { $in: removedProducts },
            affiliateProgram: _id, // Assuming AffiliateProductComTable has a reference to AffiliateProgram
          });
        }
    
        // Handle updating or inserting AffiliateProductComTable records for newly selected products
        if (addedProducts.length > 0) {
          for (let productId of addedProducts) {
            await AffiliateProductComTable.updateOne(
              { _id: productId },
              {
                $set: {
                  affiliateProgram: _id, // Associate with the Affiliate Program
                  // Add or update any other fields as necessary
                },
              },
              { upsert: true } // Use upsert to insert if the record doesn't exist
            );
          }
        }
    
        return res.success("Affiliate_Program_UPDATED", affiliateprogram);
      } catch (error) {
        console.error(error);
        res.error(error);
      }
  },

    
  /* delete: async (req, res) => {
      try {
          let user = req.user;
          let _id = new mongoose.Types.ObjectId(req.params._id);
    
          await AffiliateProgramServices.deleteOne({ _id, user: user._id });
    
          return res.success("Record_DELETED");
        } catch (error) {
          console.error(error);
          res.error(error);
        }
  }, */

  // Delete an affiliate program by ID
  deleteOne: async (req, res) => {
      try {
          let user = req.user;
          let _id = new mongoose.Types.ObjectId(req.params._id);
    
          await AffiliateProgramServices.deleteOne({ _id, user: user._id });
    
          return res.success("Record_DELETED");
        } catch (error) {
          console.error(error);
          res.error(error);
        }
  },

  // Get a listAggregate of all affiliate programs
  listAggregate: async (req, res) => {
    try {
        // let query = { status: "active" };
        const user = req.user;
        // const _id = new mongoose.Types.ObjectId(req.params._id);
        const query = { user: user._id};
        const userId = user._id;
        
        // let items = await AffiliateProgramServices.list(query, req.paginationOptions);

        /* const items = await AffiliateProductComTable.aggregate([
          {
            $match: { user: new mongoose.Types.ObjectId(userId) }
          },
          {
            $lookup: {
              from: "products",
              let: { products: "$products" },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ["$_id", "$$products"] }
                  }
                }
              ],
              as: "productDetails"
            }
          },
          // Optionally use $unwind if needed:
          // {
          //   $unwind: "$productDetails"
          // }
        ]);
        

        let total = await AffiliateProgramServices.countData(query);

        return res.success(req.nextPageOptions(items, total)); */

        const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "" } = req.query;

        // Convert `limit` and `skip` to numbers since query parameters are strings
        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip);
        const orderNum = parseInt(order);
        
        const query2 = {
          user: new mongoose.Types.ObjectId(userId),
          // Optionally add more conditions based on `search`
          ...(search && {
            $or: [
              { "productDetails.name": { $regex: search, $options: "i" } }, // assuming products have a name field
              { "productDetails.description": { $regex: search, $options: "i" } } // assuming products have a description field
            ]
          })
        };

        const items = await AffiliateProductComTable.aggregate([
          {
            $match: query2
          },
          {
            $lookup: {
              from: "products",
              let: { products: "$products" },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ["$_id", "$$products"] }
                  }
                }
              ],
              as: "productDetails"
            }
          },
          {
            $sort: { [orderBy]: orderNum }
          },
          {
            $skip: (skipNum-1)*limitNum,
          },
          {
            $limit: limitNum
          }
        ]);
        
        // Count total number of documents matching the query
        const total = await AffiliateProgramServices.countData(query);

        // Return the paginated response
        return res.success(req.nextPageOptions(items, total));

    } catch (error) {
        console.error(error);
        res.error(error);
    }
  },

  /* updateProCom: async (req, res) => {
    try {
      let user = req.user;
      let _id = req.params._id;
      const hasData = await AffiliateProgramServices.findOne(
        {
          _id,
          user: user._id,
        },
        "_id"
      );

      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }

      let data = req.body;

      const setData = {
        user: user._id,
        affiliateCommission: data.affiliateCommission,
        platformCommissionFee: data.platformCommissionFee,
      };

      const affiliateprogram = await AffiliateProgramServices.update({ _id }, setData);

      return res.success("Affiliate_Program_UPDATED", affiliateprogram);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  }, */
  
  listAggregateProducts: async (req, res) => {
    try {
      const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "" } = req.query;

      // Convert `limit` and `skip` to numbers since query parameters are strings
      const limitNum = parseInt(limit);
      const skipNum = parseInt(skip);
      const orderNum = parseInt(order);

      // Step 1: Aggregate all product _id's from the affiliateProgram collection
      const productIds = await AffiliateProductComTable.aggregate([
        {
          $unwind: "$products"  // Unwind the products array
        },
        {
          $group: {
            _id: null,  // Group by null to merge all product ids
            allProductIds: { $addToSet: "$products" }  // Add all unique product ids to an array
          }
        },
        {
          $sort: { [orderBy]: orderNum }
        },
        {
          $skip: (skipNum-1)*limitNum,
        },
        {
          $limit: limitNum
        }
      ]);

      // Extract the array of product IDs
      const ids = productIds.length > 0 ? productIds[0].allProductIds : [];

      // Step 2: Query the products collection to find all products with the retrieved IDs
      const selectedProducts = await ProductsTable.find({
        _id: { $in: ids }
      });

      // console.log(selectedProducts);
      // Check the count of the selected products
      const count = selectedProducts.length;
      // console.log(count);

      // Return the paginated response
      return res.success(req.nextPageOptions(selectedProducts, count));

    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },
};
