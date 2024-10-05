const mongoose = require('mongoose');

let AffiliateSaleSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    affiliateProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateProgram' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    commission: { type: Number, default: 0  },
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


const AffiliateSaleTable = module.exports = mongoose.model('AffiliateSale', AffiliateSaleSchema);


module.exports.getAffiliateSale = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateSaleTable.findOne(query).lean();
};