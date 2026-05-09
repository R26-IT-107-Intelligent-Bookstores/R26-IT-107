const mongoose = require("mongoose");

const trendSignalSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    salesScore: {
      type: Number,
      default: 0,
    },

    reviewScore: {
      type: Number,
      default: 0,
    },

    branchDemandScore: {
      type: Number,
      default: 0,
    },

    categoryScore: {
      type: Number,
      default: 50,
    },

    trendScore: {
      type: Number,
      default: 0,
    },

    prediction: {
      type: String,
      enum: ["Low Demand", "Moderate Demand", "High Demand"],
      default: "Low Demand",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrendSignal", trendSignalSchema);