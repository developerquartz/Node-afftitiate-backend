const mongoose = require("mongoose")
const constants = require('../config/constants.json')
let slug = require("mongoose-slug-updater")
let { transliterate } = require('transliteration');
mongoose.plugin(slug)
const variations = require("./productVariationTable");
let productSchema = new mongoose.Schema(
  {
    storeType: { type: mongoose.Schema.Types.ObjectId, ref: "storeType" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    slug: { type: String, slug: "name", unique: true, lowercase: true, trim: true, transform: v => transliterate(v) },
    type: { type: String, enum: ["simple", "variable"] },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active"
    },
    isFeatured: { type: Boolean },
    short_description: { type: String, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, trim: true },
    price: { type: Number, default: 0 },
    compare_price: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Cuisine" },
    manage_stock: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    stock_quantity: { type: Number },
    serviceTime: { type: Number, default: 0 },
    serviceUnit: { type: String, enum: constants.serviceUnit_enum, default: "min" },
    pricingType: { type: String, enum: constants.pricingType_enum, default: "unit" },
    stock_status: {
      type: String,
      enum: ["instock", "outofstock"],
      default: "instock",
    },
    total_sales: { type: Number },
    featured_image: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    attributes: { type: Array },
    related_products: { type: Array, default: [] },
    variations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "productVariation" },
    ],
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Addon" }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "productReview" }],
    average_rating: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    sold_count: { type: Number, default: 0 },
    shippingCharge: { type: Number },
    seoSettings: {
      title: { type: String, default: null },
      metaDescription: { type: String, default: null },
      metaKeywords: { type: String, default: null },
      facebook: {
        title: { type: String, default: null },
        description: { type: String, default: null },
        image: { type: String, default: null }
      },
      twitter: {
        title: { type: String, default: null },
        description: { type: String, default: null },
        image: { type: String, default: null },
        username: { type: String, default: null },
      }
    },
    date_created: { type: Date },
    date_created_utc: { type: Date, default: new Date() },
    date_modified: { type: Date },
    date_modified_utc: { type: Date },
    price_tiers: [{
      minQuantity: Number,
      maxQuantity: Number,
      infinit: Boolean,
      price: Number
    }],
    meta_data: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    weight: Number,
    adminSold: Boolean
  },
  {
    versionKey: false,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

let Product = module.exports = mongoose.model("Product", productSchema);