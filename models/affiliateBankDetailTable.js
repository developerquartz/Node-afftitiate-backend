const mongoose = require('mongoose');

let AffiliateBankDetailSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bankName: { type: String,required: true,},
    bankAddress: { type: String,},
    accountNumber: { type: String,required: true,},
    accountHolderName: { type: String,required: true,},
    ifscCode: { type: String,},
    currency: { type: String,},
    country: { type: String,},
    routingNumber: { type: String,required: true,},
    accountType: { type: String, enum: ["savings", "business"], default: "savings"},
    swiftCode: { type: String,},
    taxIdentificationNumber: { type: String,},
    status: { type: String, enum: ["active", "inactive", "archived", "expired"], default: "active" },
    date_created: { type: Date },
    date_created_utc: { type: Date },
    date_modified: { type: Date },
    date_modified_utc: { type: Date },
    meta_data: [
        {
            key: { type: String },
            value: { type: String }
        }
    ]
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });


const AffiliateBankDetailTable = module.exports = mongoose.model('AffiliateBankDetail', AffiliateBankDetailSchema);


module.exports.getAffiliateBankDetail = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateBankDetailTable.findOne(query).lean();
};
