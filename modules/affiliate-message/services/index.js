const affiliateMessageTable = require('../../../models/affiliateMessageTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


let create = async function (data) {

    const session = await mongoose.startSession();
    session.startTransaction();
    // console.log("data::",data);
    const affiliateprogram = new affiliateMessageTable(data);
    const affiliateprogramSaved = await affiliateprogram.save({ session }); 

    await session.commitTransaction();
    session.endSession();

    return affiliateprogram;
};


let list = (query, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    return affiliateMessageTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};

let update = async function (query, data) {
    // await removeDefaultAddress(data);

    return affiliateMessageTable.findOneAndUpdate(query, data, {
        new: true,
        upsert: true,
    });
};

let findOne = function (query = null, select = null) {
    // console.log('query:',query);
    return affiliateMessageTable.findOne(query, select).lean();
};

let deleteOne = async function (query) {
    // console.log(query);
    const data = await affiliateMessageTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
       // Update the status of the AffiliateProgram to "archived"
       await affiliateMessageTable.updateOne({ _id: data._id }, { status: "archived" });

       // Handle the 'default' case if applicable
       if (data.default) {
           const newDefaultProgram = await affiliateMessageTable.findOne(
               { user: query.user },
               "_id default"
           );
           if (newDefaultProgram) {
               newDefaultProgram.default = true;
               await newDefaultProgram.save();
           }
        }
        const response = await affiliateMessageTable.findOne(query).lean();
        console.log("response",response)
        return response;
    } else {
        throw new Error("affiliateMessageTableNotFounded");
    }
};

let deleteOnePermanent = async function (query) {
    // console.log(query);
    const data = await affiliateMessageTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
        const deletedCommission = await affiliateMessageTable.findByIdAndDelete(query);
        // res.status(204).json({ message: 'Commission request deleted' });
        return(deletedCommission);
    } else {
        throw new Error("affiliateMessageTableNotFounded");
    }
};

let countData = async (query) => {
    return affiliateMessageTable.countDocuments(query);
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