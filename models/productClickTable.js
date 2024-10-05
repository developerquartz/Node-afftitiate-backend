const mongoose = require('mongoose');

let ProductClicKSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    affiliateProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateProgram' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ProductClicK: { type: Number, default: 1 },
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


const ProductClicKTable = module.exports = mongoose.model('ProductClicK', ProductClicKSchema);


module.exports.getProductClicK = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return ProductClicKTable.findOne(query).lean();
};
