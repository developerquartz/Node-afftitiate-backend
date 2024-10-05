const mongoose = require('mongoose');

let AffiliateProgramSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    image: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    description: { type: String, required: true },
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


const AffiliateProgramTable = module.exports = mongoose.model('AffiliateProgram', AffiliateProgramSchema);


module.exports.getAffiliateProgram = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateProgramTable.findOne(query).lean();
};
