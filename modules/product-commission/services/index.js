const AffiliateProductComTable = require('../../../models/affiliateProductComTable');
const ProductsTable = require('../../../models/productsTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


/* let add = async (query) => {
    // return AffiliateProductComTable.countDocuments(query);
    const newProgram = new AffiliateProductComTable(req.body);
    const savedProgram = await newProgram.save();
    
} */

let create = async function (data) {

    const session = await mongoose.startSession();
    session.startTransaction();

    const affiliateprogram = new AffiliateProductComTable(data);
    const affiliateprogramSaved = await affiliateprogram.save({ session });

    // console.log('affiliateprogramSaved : ',affiliateprogramSaved.products);
    
    // Step 2: Iterate over the products and create ProductInfo entries
    const ProductInfoEntries = affiliateprogramSaved.products.map(productId => ({
        user: affiliateprogramSaved.user,
        affiliateProgmamId: affiliateprogramSaved._id,
        productId: productId,
        status: "inactive",
        date_created: new Date(),
        date_created_utc: new Date().toUTCString(),
        date_modified: new Date(),
        date_modified_utc: new Date().toUTCString(),
        meta_data: [] // Assuming meta_data will be populated later or passed in productIds array
    }));

    console.log('ProductInfoEntries', ProductInfoEntries)

    // await ProductInfoTable.insertMany(ProductInfoEntries, { session });
    try {
        await ProductInfoTable.insertMany(ProductInfoEntries, { session });
    } catch (error) {
        console.error('Error inserting products into ProductInfoTable:', error);
        await session.abortTransaction();
        session.endSession();
        throw error;
    }

    // Step 3: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return affiliateprogram;
};


let list = (query, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    return AffiliateProductComTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};

let update = async function (query, data) {
    // await removeDefaultAddress(data);

    return AffiliateProductComTable.findOneAndUpdate(query, data, {
        new: true,
        upsert: true,
    });
};

let findOne = function (query = null, select = null) {
    // console.log('query:',query);
    return AffiliateProductComTable.findOne(query, select).lean();
};

let deleteOne = async function (query) {
    // console.log(query);
    const data = await AffiliateProductComTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
        /* await AffiliateProductComTable.updateOne({ _id: data._id }, { status: "archived" });
        if (data.default) {
            const data = await AffiliateProductComTable.findOne(
                { user: query.user },
                "_id default"
            );
            if (data) {
                data.default = true;
                await data.save();
            }
        } */
       // Update the status of the AffiliateProgram to "archived"
       await AffiliateProductComTable.updateOne({ _id: data._id }, { status: "archived" });

       // Update the status of related ProductsInfo entries to "archived"
       await ProductInfoTable.updateMany(
           { affiliateProgmamId: data._id },
           { status: "archived" }
       );

       // Handle the 'default' case if applicable
       if (data.default) {
           const newDefaultProgram = await AffiliateProductComTable.findOne(
               { user: query.user },
               "_id default"
           );
           if (newDefaultProgram) {
               newDefaultProgram.default = true;
               await newDefaultProgram.save();
           }
       }
    } else {
        throw new Error("AffiliateProductComTableNotFounded");
    }
};

let countData = async (query) => {
    return AffiliateProductComTable.countDocuments(query);
}

module.exports = {
    create,
    list,
    update,
    findOne,
    deleteOne,
    countData,
    // view,
}