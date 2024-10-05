const mongoose = require('mongoose');

let AffiliateMessageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String,},
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


const AffiliateMessageTable = module.exports = mongoose.model('AffiliateMessage', AffiliateMessageSchema);


module.exports.getAffiliateMessage = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateMessageTable.findOne(query).lean();
};
