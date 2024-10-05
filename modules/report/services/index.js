const productClickTable = require('../../../models/productClickTable');
const moment = require("moment");
const utils = require("../../../utils");

const mongoose = require('mongoose');


let countData = async (query) => {
    return productClickTable.countDocuments(query);
};


module.exports = {
    countData,
}