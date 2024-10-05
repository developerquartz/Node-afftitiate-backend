"use strict";
const utils = require("../../../utils");
const AddressServices = require("../services/address");

module.exports = {
  view: async (req, res) => {
    try {
      const user = req.user;
      const _id = req.params._id;
      const query = { user: user._id, _id, status: { $ne: "archived" } };

      const item = await AddressServices.findOne(query, "-meta_data");

      if (!item) return res.error("NO_RECORD_FOUND");

      return res.success("RECORD_FOUND", item);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },
  list: async (req, res) => {
    try {
      const user = req.user;

      const query = { user: user._id, status: { $ne: "archived" } };

      const items = await AddressServices.list(query, req.paginationOptions);
      let total = await AddressServices.countData(query);

      return res.success(req.nextPageOptions(items, total));
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },
  add: async (req, res) => {
    try {
      let user = req.user;

      let data = req.body;

      const setData = {
        user: user._id,
        area: data.area,
        name: data.name,
        countryCode: data.countryCode,
        mobileNumber: data.mobileNumber,
        houseNo: data.houseNo,
        landmark: data.landmark,
        address: data.address,
        addressLocation: {
          type: "Point",
          coordinates:
            data.lattitude && data.longitude
              ? [data.longitude, data.lattitude]
              : [],
        },
        addressType: data.addressType,
        default: data.default,
      };

      const address = await AddressServices.create(setData);

      return res.success("ADDRESS_ADDED", address);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },
  update: async (req, res) => {
    try {
      let user = req.user;
      let _id = req.params._id;

      const hasData = await AddressServices.findOne(
        {
          _id,
          user: user._id,
          status: { $ne: "archived" },
        },
        "_id"
      );

      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }

      let data = req.body;

      const setData = {
        user: user._id,
        area: data.area,
        name: data.name,
        countryCode: data.countryCode,
        mobileNumber: data.mobileNumber,
        houseNo: data.houseNo,
        landmark: data.landmark,
        address: data.address,
        addressLocation: {
          type: "Point",
          coordinates:
            data.lattitude && data.longitude
              ? [data.longitude, data.lattitude]
              : [],
        },
        addressType: data.addressType,
        default: data.default,
      };

      const address = await AddressServices.update({ _id }, setData);

      return res.success("ADDRESS_UPDATED", address);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },
  makeDefaultAddress: async (req, res) => {
    try {
      let user = req.user;
      let _id = req.params._id;

      const hasData = await AddressServices.findOne(
        {
          _id,
          user: user._id,
          status: { $ne: "archived" },
        },
        "_id"
      );

      if (!hasData) {
        return res.error("NO_RECORD_FOUND");
      }

      const address = await AddressServices.update(
        { _id },
        { default: true, user: user._id }
      );

      return res.success("ADDRESS_UPDATED", address);
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },
  delete: async (req, res) => {
    try {
      let user = req.user;
      let _id = req.params._id;

      await AddressServices.deleteOne({ _id, user: user._id });

      return res.success("Record_DELETED");
    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },


  test: async (req, res) => {
    try {
      const arr = [0, -2, -2, 5, 5, 5];
      let counts = {};
      let totaldup = 0;

      // Count occurrences of each number
      for (const num of arr) {
        if (counts[num]) {
          counts[num] += 1;
        } else {
          counts[num] = 1;
        }
      }

      // Calculate total duplicates
      for (const count of Object.values(counts)) {
        if (count > 1) {
          totaldup += (count - 1);  // Only add duplicates (count - 1)
        }
      }

      // return totaldup;
      return res.success("message", totaldup);

    } catch (error) {
      console.error(error);
      res.error(error);
    }
  },


};
