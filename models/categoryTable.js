const mongoose = require('mongoose');
let slug = require('mongoose-slug-updater');
const File = require("./fileTable")
mongoose.plugin(slug);
let categorySchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    catName: { type: String, required: true },
    slug: { type: String, slug: "catName", unique: true, lowercase: true },
    catDesc: { type: String },
    catImage: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    isFeatured: { type: Boolean },
    parent: { type: String, default: "none" },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    sortOrder: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive", "archived"], default: "active" },
    date_created: { type: Date, default: new Date() },
    date_created_utc: { type: Date, default: new Date() },
    date_modified: { type: Date, default: new Date() },
    date_modified_utc: { type: Date, default: new Date() },
    meta_data: [
        {
            key: { type: String },
            value: { type: String }
        }
    ]
},
    {
        versionKey: false
    });

const categoryTable = module.exports = mongoose.model('Category', categorySchema);
