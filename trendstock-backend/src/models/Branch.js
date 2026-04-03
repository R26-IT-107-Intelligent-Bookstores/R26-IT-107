const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String
    },
    managerName: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", branchSchema);