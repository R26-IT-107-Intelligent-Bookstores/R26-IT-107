const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);