const mongoose = require('mongoose');

let ProductInfoSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    affiliateProgmamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    affiliateCommission: { type: Number, default: 0 },
    platformCommissionFee: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "archived", "expired"], default: "inactive" },
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


const ProductInfoTable = module.exports = mongoose.model('ProductInfo', ProductInfoSchema);


module.exports.getProductInfo = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return ProductInfoTable.findOne(query).lean();
};
