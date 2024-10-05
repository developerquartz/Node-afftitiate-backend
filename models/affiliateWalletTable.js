const mongoose = require('mongoose');

let AffiliateWalletSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number,default: 0.0,},
    currency: { type: String,default: 'USD',},
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


const AffiliateWalletTable = module.exports = mongoose.model('AffiliateWallet', AffiliateWalletSchema);


module.exports.getAffiliateWallet = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateWalletTable.findOne(query).lean();
};