const commissionRequestTable = require('../../../models/affiliateCommissionRequestTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


let create = async function (data) {

    const session = await mongoose.startSession();
    session.startTransaction();
    // console.log("data::",data);
    const affiliateprogram = new commissionRequestTable(data);
    const affiliateprogramSaved = await affiliateprogram.save({ session }); 

    await session.commitTransaction();
    session.endSession();

    return affiliateprogram;
};


let list = (query, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    return commissionRequestTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};

let update = async function (query, data) {
    // await removeDefaultAddress(data);

    return commissionRequestTable.findOneAndUpdate(query, data, {
        new: true,
        upsert: true,
    });
};

let findOne = function (query = null, select = null) {
    // console.log('query:',query);
    return commissionRequestTable.findOne(query, select).lean();
};

let deleteOne = async function (query) {
    // console.log(query);
    const data = await commissionRequestTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
       // Update the status of the AffiliateProgram to "archived"
       await commissionRequestTable.updateOne({ _id: data._id }, { status: "archived" });

       // Handle the 'default' case if applicable
       if (data.default) {
           const newDefaultProgram = await commissionRequestTable.findOne(
               { user: query.user },
               "_id default"
           );
           if (newDefaultProgram) {
               newDefaultProgram.default = true;
               await newDefaultProgram.save();
           }
        }
        const response = await commissionRequestTable.findOne(query).lean();
        console.log("response",response)
        return response;
    } else {
        throw new Error("commissionRequestTableNotFounded");
    }
};

let deleteOnePermanent = async function (query) {
    // console.log(query);
    const data = await commissionRequestTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
        const deletedCommission = await commissionRequestTable.findByIdAndDelete(query);
        // res.status(204).json({ message: 'Commission request deleted' });
        return(deletedCommission);
    } else {
        throw new Error("commissionRequestTableNotFounded");
    }
};

let countData = async (query) => {
    return commissionRequestTable.countDocuments(query);
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