// const AffiliateProgram = require('../../../models/affiliateProgram');
const AffiliateProgramServices = require('../services');
const AffiliateProgramTable = require('../../../models/affiliateProgramTable');
const AffiliateProgramComTable = require('../../../models/affiliateProductComTable');
const ProductsTable = require('../../../models/productsTable');

const Product = require('../services');
const utils = require("../../../utils");
const { default: mongoose } = require('mongoose');
const { contentSecurityPolicy } = require('helmet');


module.exports = {
  // Add a new affiliate program
  add: async (req, res) => {
      try {
        const fileUrl = req.file.location; // Get the file URL
        // res.status(200).json({ url: fileUrl });
        // console.log("fileUrl:::",fileUrl);
      } catch (error) {
        res.error("Please upload the Image.");
        // console.error(error);
        // res.error(error);
      }
      try {
          let data = req.body;
          data.user = req.user._id; 
          data.image = req.file.location; // get Image URL
          // data.status = "active";
          const { date, utcDate } = utils.getDate();
          data.date_created_utc = utcDate;
          data.date_created = date;

          console.log("Data:::",data);

          const affiliateprogram = await AffiliateProgramServices.create(data);
        
          return res.success("Affiliate program added successfully", { affiliateprogram });
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
        const query = { user: user._id, status: {$ne : "archived"}};
        // const query = { user: user._id};
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
        const record = await AffiliateProgramTable.aggregate([
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
                    $addFields: {
                      featured_image_link: { $arrayElemAt: ["$featured_image_details.link", 0] }
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
        // return res.json(record[0]); // Since aggregate returns an array, we return the first item
        return res.success("Single affiliate program.", record[0]);
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

      /* try {
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
    
        // Handle removing AffiliateProgramTable records for de-selected products
        if (removedProducts.length > 0) {
          await AffiliateProgramTable.deleteMany({
            _id: { $in: removedProducts },
            affiliateProgram: _id, // Assuming AffiliateProgramTable has a reference to AffiliateProgram
          });
        }
    
        // Handle updating or inserting AffiliateProgramTable records for newly selected products
        if (addedProducts.length > 0) {
          for (let productId of addedProducts) {
            await AffiliateProgramTable.updateOne(
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

      // const pidArray = data.products.map(product => product.pid);
      let products = data.products;
        
      if (typeof products === 'string') {
          products = JSON.parse(products); // Parse if it is a string
      }
      const productIds = products.map(product => product.pid);

      // temData.products = productIds;

      // console.log('pidArray:::',pidArray);
      // console.log('products::::::',data.products);

      if (req.file && req.file.location && typeof req.file.location === 'string') {
        data.image = req.file.location; // Get Image URL
      }
  
      // Prepare the data to update
      const setData = {
        user: user._id,
        name: data.name,
        country: data.country,
        // products: data.products,
        products: productIds,
        image: data.image,
        bio: data.bio,
        description: data.description,
        status: data.status,
      };


      // Update the Affiliate Program record
      const affiliateprogram = await AffiliateProgramServices.update({ _id }, setData);
    
      // Get the previous products from the Affiliate Program
      /* const previousProducts = hasData.products || [];
      const updatedProducts = pidArray || [];

      console.log("previousProducts",previousProducts);
      console.log("updatedProducts",updatedProducts);
  
      // Find products that were removed (de-selected)
      const removedProducts = previousProducts.filter(
        (productId) => !updatedProducts.includes(productId.toString())
      );
  
      // Find products that were added (newly selected)
      const addedProducts = updatedProducts.filter(
        (productId) => !previousProducts.includes(productId.toString())
      );

      
      console.log("removedProducts",removedProducts);
      console.log("addedProducts",addedProducts);
  
      // Handle removing AffiliateProgramTable records for de-selected products
      if (removedProducts.length > 0) {
        await AffiliateProgramTable.deleteMany({
          _id: { $in: removedProducts },
          affiliateProgram: _id, // Assuming AffiliateProgramTable has a reference to AffiliateProgram
        });
      }

      if (removedProducts.length > 0) {
        console.log(removedProducts);
      }
  
      // Handle updating or inserting AffiliateProgramTable records for newly selected products
      if (addedProducts.length > 0) {
        for (let productId of addedProducts) {
          await AffiliateProgramTable.updateOne(
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
      } */

      return res.success("Affiliate program updated successfully.", affiliateprogram);
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
    
          let response = await AffiliateProgramServices.deleteOne({ _id, user: user._id });
          console.log("response::",response);
          return res.success(response);
        } catch (error) {
          console.error(error);
          res.error(error);
        }
  },

  // Controller Function to handle deletion of multiple entries
  deleteMany: async (req, res) => {
    try {
        let user = req.user;
        let ids = req.body.ids.map(id => new mongoose.Types.ObjectId(id));

        let response = await AffiliateProgramServices.deleteMany({ _id: { $in: ids }, user: user._id });
        console.log("response::", req.body);
        return res.success(ids);
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

        /* const items = await AffiliateProgramTable.aggregate([
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
          status: { $ne: "archived" },
          // Optionally add more conditions based on `search`
          ...(search && {
            $or: [
              { "name": { $regex: search, $options: "i" } }, // assuming products have a name field
              { "description": { $regex: search, $options: "i" } } // assuming products have a description field
            ]
          })
        };

        /* const items = await AffiliateProgramTable.aggregate([
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
          },
        ]); */

        const items = await AffiliateProgramTable.aggregate([
          {
            // $match: { /* your matching conditions here, if any */ }
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
                  $addFields: {
                    featured_image_link: { $arrayElemAt: ["$featured_image_details.link", 0] }
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
          },
        ]);
        
        
        
        
        // Count total number of documents matching the query
        // const total = await AffiliateProgramServices.countData(query);
        const total = await AffiliateProgramServices.countData(query2);

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
      const productIds = await AffiliateProgramTable.aggregate([
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

  // Get a list of all un-used in affiliate programs
  unusedList: async (req, res) => {
    try {
      const user = req.user;
      const query = { user: user._id, status: { $ne: "archived" } };
      
      // Fetch the product IDs associated with the user
      const productIds = await AffiliateProgramComTable.find(query)
          .select('product')
          .lean(); // Use lean() for performance if you only need plain JavaScript objects
  
      // Extract product IDs from the results
      const productIdArray = productIds.map(entry => entry.product.toString());
  
      // Remove duplicates using Set
      const uniqueProductIds = [...new Set(productIdArray)];
      // return res.success(productIdArray);

      const result = await ProductsTable.aggregate([
        // Match the products with IDs in the uniqueProductIds array
        {
            $match: {
                _id: { $in: uniqueProductIds.map(id =>new mongoose.Types.ObjectId(id)) }
            }
        },
        // Lookup to join with ProductClicKTable and count clicks
        {
            $lookup: {
                from: 'productclicks', // The collection name for ProductClicKTable
                localField: '_id', // The _id field from Product
                foreignField: 'product', // The product field in ProductClicKTable
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
        res.error(error);
    }
  },

  
  // Get a list of all un-used in affiliate programs
  listAffiPros: async (req, res) => {
    try {
      const _id = new mongoose.Types.ObjectId(req.params._id);
      // const query = { user: _id, status: {$ne : "archived"}};
      const query = { user: _id, status: "active" };

      let items = await AffiliateProgramServices.listAffiPros(query, req.paginationOptions);
      let total = await AffiliateProgramServices.countData(query);

      return res.success(req.nextPageOptions(items, total));

      // const _id = new mongoose.Types.ObjectId(req.params._id);
      // const query = { user: _id, status: {$ne : "archived"}};
      
      // const affiliatePrograms = await AffiliateProgramTable.find(query)
      // .lean(); // Use lean() for performance if you only need plain JavaScript objects
      /* console.log(query);
      // return res.success(affiliatePrograms);
      let items = await AffiliateProgramServices.list(query, req.paginationOptions);
      let total = await AffiliateProgramServices.countData(query);
      console.log(total);
      
      contentSecurityPolicy

      // Return the paginated response
      return res.success(req.nextPageOptions(items, total)); */
    } catch (error) {
        console.error(error);
        res.error(error);
    }
  },
  
  // Get a list of all un-used in affiliate programs
  listAffiProProds: async (req, res) => {
    /* try {
        // let query = { status: "active" };
        // const user = req.user;
        // const _id = new mongoose.Types.ObjectId(req.params._id);
        let data = req.body;
        const query = { user: data.affi_user, _id:data.affi_pro, status: {$ne : "archived"}};
        // const query = { user: user._id};
        console.log(query + " data:" +data);
        const affiliatePrograms = await AffiliateProgramTable.find(query)
        // const productIds = await AffiliateProgramComTable.find({ user: _id})
            // .select('product')
            .lean(); // Use lean() for performance if you only need plain JavaScript objects

        // Extract product IDs from the results
        // const productIdArray = productIds.map(entry => entry.product);

        contentSecurityPolicy

        // let items = await AffiliateProgramServices.list(query, req.paginationOptions);
        // let total = await AffiliateProgramServices.countData(query);

        // return res.success(req.nextPageOptions(items, total));
        // return res.success(productIdArray);
        return res.success(affiliatePrograms);
    } catch (error) {
        console.error(error);
        res.error(error);
    } */

    try {
      const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "" } = req.query;
      const data = req.params;

      const query = {
        _id: new mongoose.Types.ObjectId(req.query.affi_pro),
        // user: new mongoose.Types.ObjectId(req.query.affi_user),
        status: { $ne: "archived" },
        ...(search && {
          $or: [
          { "productDetails.name": { $regex: search, $options: "i" } }, // assuming products have a name field
          { "productDetails.description": { $regex: search, $options: "i" } } // assuming products have a description field
          ]
        })
      };

      // Convert `limit` and `skip` to numbers since query parameters are strings
      const limitNum = parseInt(limit);
      const skipNum = parseInt(skip);
      const orderNum = parseInt(order);

      // Step 1: Aggregate all product _id's from the affiliateProgram collection
      const AffiProgProducts = await AffiliateProgramTable.aggregate([
      {
        $match: query,
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
          ],
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails" // Unwind to handle products individually
      },
      {
        $sort: { [`productDetails.${orderBy}`]: orderNum } // Sort the products
      },
      {
        $skip: (skipNum - 1) * limitNum, // Skip products for pagination
      },
      {
        $limit: limitNum // Limit the number of products returned
      },
      {
        $group: {
          _id: "$_id", // Group back by affiliate program ID
          products: { $push: "$productDetails" }, // Collect paginated products
        }
      },
      {
        $project: {
          _id: 1,
          products: 1
        }
      }
      ]);

      // Step 2: Query the products collection to find all products with the retrieved IDs
      /* const ids = AffiProgProducts.length > 0 ? AffiProgProducts[0].products.map(p => p._id) : [];
      const selectedProducts = await ProductsTable.find({ _id: { $in: ids } });
      console.log("ids::",ids)
      // Check the count of the selected products
      const count = ids.length/limitNum;
      // const count = selectedProducts.length; */

      // Fetch the record with populated product details and count
      const record = await AffiliateProgramTable.aggregate([
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
        },
        {
            $project: {
                _id: 1,
                user: 1,
                productDetails: 1,
                productDetailsCount: { $size: "$productDetails" } // Add a field for the count of productDetails
            }
        }
      ]).exec();

      // Assuming only one record is returned since you're querying by _id
      const productDetailsCount = record.length > 0 ? record[0].productDetailsCount : 0;

      return res.success(req.nextPageOptions(AffiProgProducts, productDetailsCount));
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },


  // Get a listAggregate of all affiliate programs frontend
  listAffiProdAggregate: async (req, res) => {
    try {
        // let query = { status: "active" };
        const _id = new mongoose.Types.ObjectId(req.params._id);
        
        const { limit = 10, skip = 1, order = -1, orderBy = "date_created_utc", search = "" } = req.query;

        // Convert `limit` and `skip` to numbers since query parameters are strings
        const limitNum = parseInt(limit);
        const skipNum = parseInt(skip);
        const orderNum = parseInt(order);
        
        const query2 = {
          user: new mongoose.Types.ObjectId(_id),
          status: { $ne: "archived" },
          // Optionally add more conditions based on `search`
          ...(search && {
            $or: [
              { "productDetails.name": { $regex: search, $options: "i" } }, // assuming products have a name field
              { "productDetails.description": { $regex: search, $options: "i" } } // assuming products have a description field
            ]
          })
        };

        const items = await AffiliateProgramTable.aggregate([
          {
            // $match: { /* your matching conditions here, if any */ }
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
                  $addFields: {
                    featured_image_link: { $arrayElemAt: ["$featured_image_details.link", 0] }
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
          },
        ]);
        
        // Count total number of documents matching the query
        const total = await AffiliateProgramServices.countData(query2);

        // Return the paginated response
        return res.success(req.nextPageOptions(items, total));

    } catch (error) {
        console.error(error);
        res.error(error);
    }
  },

  // Get a list of all affiliate programs
  totalCounts: async (req, res) => {
    try {
        const data = {};
        // let query = { status: "active" };
        const user = req.user; 
        // const _id = new mongoose.Types.ObjectId(req.params._id);
        const query = { user: user._id, status: {$ne : "archived"}};
        // let items = await AffiliateProgramServices.list(query);
        // let total = await AffiliateProgramServices.countData(query);
        // let AffiliatePrograms = await AffiliateProgramTable.find(query);
        let AffiliateProgramTotal = await AffiliateProgramTable.countDocuments(query);
        data['AffiliateProgramTotal'] = AffiliateProgramTotal > 0 ? AffiliateProgramTotal : 0;
        
        // Use aggregation to sum the total number of products across all matching documents
        let productTotalResult = await AffiliateProgramTable.aggregate([
          { $match: query },
          { $unwind: "$products" }, // Unwind the products array
          { $group: { _id: null, totalProducts: { $sum: 1 } } } // Sum the count of products
        ]);

        data['productTotal'] = productTotalResult.length > 0 ? productTotalResult[0].totalProducts : 0;

        return res.success(data);
    } catch (error) {
        console.error(error);
        res.error(error);
    }
  },


};
