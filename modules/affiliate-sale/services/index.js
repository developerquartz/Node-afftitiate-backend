const affiliateSaleTable = require('../../../models/affiliateSaleTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


let create = async function (data) {

    const session = await mongoose.startSession();
    session.startTransaction();
    // console.log("data::",data);
    const bankDetail = new affiliateSaleTable(data);
    const bankDetailSaved = await bankDetail.save({ session }); 

    await session.commitTransaction();
    session.endSession();

    return bankDetailSaved;
};


let list = (query, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    return affiliateSaleTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};

let update = async function (query, data) {
    // await removeDefaultAddress(data);

    return affiliateSaleTable.findOneAndUpdate(query, data, {
        new: true,
        upsert: true,
    });
};

let findOne = function (query = null, select = null) {
    // console.log('query:',query);
    return affiliateSaleTable.findOne(query, select).lean();
};

let deleteOne = async function (query) {
    // console.log(query);
    const data = await affiliateSaleTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
       // Update the status of the AffiliateProgram to "archived"
       await affiliateSaleTable.updateOne({ _id: data._id }, { status: "archived" });

       // Handle the 'default' case if applicable
       if (data.default) {
           const newDefaultProgram = await affiliateSaleTable.findOne(
               { user: query.user },
               "_id default"
           );
           if (newDefaultProgram) {
               newDefaultProgram.default = true;
               await newDefaultProgram.save();
           }
        }
        const response = await affiliateSaleTable.findOne(query).lean();
        console.log("response",response)
        return response;
    } else {
        throw new Error("affiliateSaleTableNotFounded");
    }
};

let deleteOnePermanent = async function (query) {
    // console.log(query);
    const data = await affiliateSaleTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
        const deletedCommission = await affiliateSaleTable.findByIdAndDelete(query);
        // res.status(204).json({ message: 'Commission request deleted' });
        return(deletedCommission);
    } else {
        throw new Error("affiliateSaleTableNotFounded");
    }
};

let countData = async (query) => {
    return affiliateSaleTable.countDocuments(query);
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