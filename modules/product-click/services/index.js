const productClickTable = require('../../../models/productClickTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


let create = async function (data) {

    const session = await mongoose.startSession();
    session.startTransaction();
    // console.log("data::",data);
    const affiliateprogram = new productClickTable(data);
    const affiliateprogramSaved = await affiliateprogram.save({ session }); 

    await session.commitTransaction();
    session.endSession();

    return affiliateprogram;
};


let list = (query,req, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    
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

    return productClickTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};


let update = async function (query, data) {
    // await removeDefaultAddress(data);

    return productClickTable.findOneAndUpdate(query, data, {
        new: true,
        upsert: true,
    });
};

let findOne = function (query = null, select = null) {
    // console.log('query:',query);
    return productClickTable.findOne(query, select).lean();
};

let deleteOne = async function (query) {
    // console.log(query);
    const data = await productClickTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
       // Update the status of the AffiliateProgram to "archived"
       await productClickTable.updateOne({ _id: data._id }, { status: "archived" });

       // Handle the 'default' case if applicable
       if (data.default) {
           const newDefaultProgram = await productClickTable.findOne(
               { user: query.user },
               "_id default"
           );
           if (newDefaultProgram) {
               newDefaultProgram.default = true;
               await newDefaultProgram.save();
           }
        }
        const response = await productClickTable.findOne(query).lean();
        console.log("response",response)
        return response;
    } else {
        throw new Error("productClickTableNotFounded");
    }
};

let deleteOnePermanent = async function (query) {
    // console.log(query);
    const data = await productClickTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
        const deletedproductClick = await productClickTable.findByIdAndDelete(query);
        // res.status(204).json({ message: 'productClick request deleted' });
        return(deletedproductClick);
    } else {
        throw new Error("productClickTableNotFounded");
    }
};

let countData = async (query) => {
    return productClickTable.countDocuments(query);
}


module.exports = {
    create,
    list,
    update,
    findOne,
    deleteOne,
    countData,
    deleteOnePermanent,
}