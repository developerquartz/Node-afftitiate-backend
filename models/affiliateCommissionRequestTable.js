const mongoose = require('mongoose');

let AffiliateComReqSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number,required: true,},
    paymentIntentId: { type: String,},
    status: { type: String,enum: ['pending', 'approved', 'paid', 'rejected', 'archived'],default: 'pending',},
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


const AffiliateComReqTable = module.exports = mongoose.model('AffiliateComReq', AffiliateComReqSchema);


module.exports.getAffiliateComReq = function (code) {
    let query = { code: { $regex: `^${code}$` }, status: "active" };
    return AffiliateComReqTable.findOne(query).lean();
};
