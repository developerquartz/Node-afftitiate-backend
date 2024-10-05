const AffiliateProgramTable = require('../../../models/affiliateProgramTable');
const ProductInfoTable = require('../../../models/ProductInfoTable');
const AffiliateProductComTable = require('../../../models/affiliateProductComTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


/* let add = async (query) => {
    // return AffiliateProgramTable.countDocuments(query);
    const newProgram = new AffiliateProgramTable(req.body);
    const savedProgram = await newProgram.save();
    
} */

let create = async function (data) {

    const session = await mongoose.startSession();
    session.startTransaction();
    const temData = data;
    // console.log("Before change data::",data);
    // console.log("temData::",temData);
    // console.log("temData.products.afcom::",temData.products.afcom);

    // temData.products.forEach(productId => {
    //     console.log("temDataMapDta::" + productId.afcom);
    // });

    /* const AffiliateProductComEntries = [];
    data.products.forEach(productId => {
        AffiliateProductComEntries.push({
            user: data.user,
            // affiliateProgram: affiliateprogram._id,
            product: productId.pid,
            affiliateProgramComm: productId.afcom,
            platformComm: productId.pcom,
            status: "inactive",
            date_created: new Date(),
            date_created_utc: new Date().toUTCString(),
            date_modified: new Date(),
            date_modified_utc: new Date().toUTCString(),
            meta_data: [] 
        });
        // console.log("productId.pid",productId);
        // console.log("productId.afcom",productId.afcom);
        // console.log("productId.pcom",productId.pcom);
    }); */

    let products = data.products;
    // console.log(products);
    if (typeof products === 'string') {
        products = JSON.parse(products); // Parse if it is a string
    }
    const productIds = products.map(product => product.pid);

    temData.products = productIds;

    // Transform the products array
    // temData.products = temData.products.map(product => product.pid);
    
    // console.log("data::",data);
    
    const affiliateprogram = new AffiliateProgramTable(temData);
    const affiliateprogramSaved = await affiliateprogram.save({ session });

    const affiliateprogram_id = affiliateprogram._id;
    // console.log('affiliateprogram_id : ',affiliateprogram_id);
    
    // Step 2: Iterate over the products and create ProductInfo entries
    /* const AffiliateProductComEntries1 = [];
    AffiliateProductComEntries.forEach(productId => {
        AffiliateProductComEntries1.push({
            user: data.user,
            affiliateProgram: affiliateprogram_id,
            product: productId.product,
            affiliateProgramComm: productId.affiliateProgramComm,
            platformComm: productId.platformComm,
            status: "inactive",
            date_created: new Date(),
            date_created_utc: new Date().toUTCString(),
            date_modified: new Date(),
            date_modified_utc: new Date().toUTCString(),
            meta_data: [] 
        });
        // console.log("AffiliateProductComEntries1: productId.pid",productId.product);
        // console.log("productId.afcom",productId.afcom);
        // console.log("productId.pcom",productId.pcom);
    });

    console.log('AffiliateProductComEntries', AffiliateProductComEntries);
    console.log('AffiliateProductComEntries1', AffiliateProductComEntries1);

    // await AffiliateProductComTable.insertMany(AffiliateProductComEntries, { session });
    try {
        await AffiliateProductComTable.insertMany(AffiliateProductComEntries1, { session });
    } catch (error) {
        console.error('Error inserting products into AffiliateProductComTable:', error);
        await session.abortTransaction();
        session.endSession();
        throw error;
    } */

    // Step 3: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return affiliateprogram;
};


let list = (query, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    return AffiliateProgramTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};

let update = async function (query, data) {
    // await removeDefaultAddress(data);

    return AffiliateProgramTable.findOneAndUpdate(query, data, {
        new: true,
        upsert: true,
    });
};

let findOne = function (query = null, select = null) {
    // console.log('query:',query);
    return AffiliateProgramTable.findOne(query, select).lean();
};

let deleteOne = async function (query) {
    // console.log(query);
    const data = await AffiliateProgramTable.findOne(query, "_id default").lean();
    // console.log(data);
    if (!!data) {
        /* await AffiliateProgramTable.updateOne({ _id: data._id }, { status: "archived" });
        if (data.default) {
            const data = await AffiliateProgramTable.findOne(
                { user: query.user },
                "_id default"
            );
            if (data) {
                data.default = true;
                await data.save();
            }
        } */
       // Update the status of the AffiliateProgram to "archived"
       await AffiliateProgramTable.updateOne({ _id: data._id }, { status: "archived" });

       // Update the status of related ProductsInfo entries to "archived"
       await AffiliateProductComTable.updateMany(
           { affiliateProgmamId: data._id },
           { status: "archived" }
       );

       // Handle the 'default' case if applicable
       if (data.default) {
           const newDefaultProgram = await AffiliateProgramTable.findOne(
               { user: query.user },
               "_id default"
           );
           if (newDefaultProgram) {
               newDefaultProgram.default = true;
               await newDefaultProgram.save();
           }
        }
        const response = await AffiliateProgramTable.findOne(query).lean();
        console.log("response",response)
        return response;
    } else {
        throw new Error("AffiliateProgramTableNotFounded");
    }
};

let deleteMany = async function (query) {
    const data = await AffiliateProgramTable.find(query, "_id default").lean();

    if (data && data.length > 0) {
        // Extract IDs to be updated
        let ids = data.map(item => item._id);

        // Update the status of the AffiliatePrograms to "archived"
        await AffiliateProgramTable.updateMany({ _id: { $in: ids } }, { status: "archived" });

        // Update the status of related ProductsInfo entries to "archived"
        await AffiliateProductComTable.updateMany(
            { affiliateProgmamId: { $in: ids } },
            { status: "archived" }
        );

        // Handle the 'default' case if applicable
        const defaultPrograms = data.filter(item => item.default);
        if (defaultPrograms.length > 0) {
            const newDefaultProgram = await AffiliateProgramTable.findOne(
                { user: query.user, _id: { $nin: ids } }, // Exclude the archived IDs
                "_id default"
            );
            if (newDefaultProgram) {
                newDefaultProgram.default = true;
                await newDefaultProgram.save();
            }
        }

        const response = await AffiliateProgramTable.find(query).lean();
        console.log("response", response);
        return response;
    } else {
        throw new Error("AffiliateProgramTableNotFounded");
    }
};

let countData = async (query) => {
    return AffiliateProgramTable.countDocuments(query);
}

let listAffiPros = (query, { limit, skip, order, orderBy, search }) => {
    if (search) {
        query.name = { $regex: new RegExp(search, 'i') };
    };
    return AffiliateProgramTable.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [orderBy]: order })
        .select()
        .lean()
};

let totalCounts = (query, { limit, skip, order, orderBy, search }) => {
    return AffiliateProgramTable.find(query).select().lean()
};

module.exports = {
    create,
    list,
    update,
    findOne,
    deleteOne,
    deleteMany,
    countData,
    listAffiPros,
    // view,
}