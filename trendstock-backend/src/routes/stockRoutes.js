const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Inventory = require("../models/Inventory");
const { recomputeTrend } = require("../services/recomputeTrend");

// POST /api/stock/add
// body: { "book": "...", "branch": "...", "quantity": 10 }
router.post("/add", async (req, res) => {
  try {
    const { book, branch } = req.body;
    const quantity = Number(req.body.quantity);

    if (
      !mongoose.isValidObjectId(book) ||
      !mongoose.isValidObjectId(branch) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        error: "book, branch and a whole-number quantity (1 or more) are required",
      });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { book, branch },
      { $inc: { quantity } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const trend = await recomputeTrend(book, branch);

    res.status(201).json({
      success: true,
      message: "Stock added and trend recalculated",
      updatedInventory: inventory,
      trendSignal: trend,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;