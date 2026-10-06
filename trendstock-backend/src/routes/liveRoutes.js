const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");
const { recomputeTrend } = require("../services/recomputeTrend");

// POST /api/live/sell
// body: { "bookId": "...", "branchId": "...", "quantity": 1 }
router.post("/sell", async (req, res) => {
  try {
    const { bookId, branchId } = req.body;
    const quantity = Number(req.body.quantity);

    if (
      !mongoose.isValidObjectId(bookId) ||
      !mongoose.isValidObjectId(branchId) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        error: "bookId, branchId and a whole-number quantity (1 or more) are required",
      });
    }

    // 1. reduce stock only if enough is available (safe against two sales at once)
    const inventory = await Inventory.findOneAndUpdate(
      { book: bookId, branch: branchId, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity } },
      { new: true }
    );

    if (!inventory) {
      return res.status(400).json({
        success: false,
        error: "Insufficient stock or inventory record not found",
      });
    }

    // 2. record the sale (undo the stock change if this fails)
    try {
      await Sales.create({
        book: bookId,
        branch: branchId,
        quantitySold: quantity,
        saleDate: new Date(),
      });
    } catch (err) {
      await Inventory.updateOne({ _id: inventory._id }, { $inc: { quantity } });
      throw err;
    }

    // 3. recalculate the trend score
    const trend = await recomputeTrend(bookId, branchId);

    res.status(201).json({
      success: true,
      message: "Sale recorded",
      data: {
        currentStock: inventory.quantity,
        trendScore: trend.trendScore,
        prediction: trend.prediction,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;