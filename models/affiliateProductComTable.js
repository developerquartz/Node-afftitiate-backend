const mongoose = require('mongoose');

let AffiliateProgramComSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    affiliateProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateProgram' },
    affiliateProgramComm: { type: Number, default: 0 },
    platformComm: { type: Number, default: 0 },
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


const AffiliateProgramComTable = module.exports = mongoose.model('AffiliateProgramCom', AffiliateProgramComSchema);


module.exports.getAffiliateProgramCom = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateProgramComTable.findOne(query).lean();
};
