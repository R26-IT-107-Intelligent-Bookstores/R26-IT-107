const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");
const TrendSignal = require("../models/TrendSignal");
const { recomputeTrend } = require("../services/recomputeTrend");

// POST - add sales record + reduce inventory + recompute trend signal
router.post("/", async (req, res) => {
  try {
    const { book, branch, saleDate } = req.body;
    const quantitySold = Number(req.body.quantitySold);

    if (
      !mongoose.isValidObjectId(book) ||
      !mongoose.isValidObjectId(branch) ||
      !Number.isInteger(quantitySold) ||
      quantitySold < 1
    ) {
      return res.status(400).json({
        success: false,
        error: "book, branch and a whole-number quantitySold (1 or more) are required",
      });
    }

    // 1. reduce stock only if enough is available (safe against simultaneous sales)
    const inventory = await Inventory.findOneAndUpdate(
      { book, branch, quantity: { $gte: quantitySold } },
      { $inc: { quantity: -quantitySold } },
      { new: true }
    );

    if (!inventory) {
      const exists = await Inventory.exists({ book, branch });
      return res.status(exists ? 400 : 404).json({
        success: false,
        error: exists
          ? "Not enough stock available"
          : "Inventory record not found for this book and branch",
      });
    }

    // 2. record the sale (put the stock back if this fails)
    let sale;
    try {
      sale = await Sales.create({
        book,
        branch,
        quantitySold,
        saleDate: saleDate || new Date(),
      });
    } catch (err) {
      await Inventory.updateOne({ _id: inventory._id }, { $inc: { quantity: quantitySold } });
      throw err;
    }

    // 3. recalculate the trend score from real data
    let trendSignal = await recomputeTrend(book, branch);

    const reason =
      trendSignal.prediction === "High Demand"
        ? "High sales activity, strong engagement indicators, and reduced stock level"
        : trendSignal.prediction === "Moderate Demand"
        ? "Moderate sales and engagement activity detected"
        : "Demand indicators are still low compared to available stock";

    trendSignal = await TrendSignal.findByIdAndUpdate(
      trendSignal._id,
      { reason },
      { new: true }
    );

    const populatedSale = await Sales.findById(sale._id)
      .populate("book")
      .populate("branch");

    res.status(201).json({
      success: true,
      data: populatedSale,
      updatedInventory: inventory,
      trendSignal,
      message: "Sale recorded, inventory updated, and trend signal recalculated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - recent sales (paginated to avoid loading the entire sales history).
// Defaults to the 100 most recent records. Use ?limit=200 or ?limit=500 for more.
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);

    const sales = await Sales.find()
      .populate("book")
      .populate("branch")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - delete sale, restore inventory quantity, recompute trend
router.delete("/:id", async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: "Sale record not found",
      });
    }

    await Inventory.updateOne(
      { book: sale.book, branch: sale.branch },
      { $inc: { quantity: sale.quantitySold } }
    );

    await Sales.findByIdAndDelete(req.params.id);
    await recomputeTrend(sale.book, sale.branch);

    res.json({
      success: true,
      message: "Sale deleted, inventory restored and trend recalculated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT - update sale, adjust inventory, recompute trend
router.put("/:id", async (req, res) => {
  try {
    const oldSale = await Sales.findById(req.params.id);

    if (!oldSale) {
      return res.status(404).json({
        success: false,
        error: "Sale record not found",
      });
    }

    const { book, branch, quantitySold, saleDate } = req.body;

    // restore old quantity back to old inventory
    const oldInventory = await Inventory.findOne({
      book: oldSale.book,
      branch: oldSale.branch,
    });

    if (oldInventory) {
      oldInventory.quantity += oldSale.quantitySold;
      await oldInventory.save();
    }

    // reduce new quantity from new inventory
    const newInventory = await Inventory.findOne({ book, branch });

    if (!newInventory) {
      return res.status(404).json({
        success: false,
        error: "Inventory record not found for selected book and branch",
      });
    }

    if (newInventory.quantity < Number(quantitySold)) {
      return res.status(400).json({
        success: false,
        error: "Not enough stock available",
      });
    }

    newInventory.quantity -= Number(quantitySold);
    await newInventory.save();

    const updatedSale = await Sales.findByIdAndUpdate(
      req.params.id,
      {
        book,
        branch,
        quantitySold: Number(quantitySold),
        saleDate,
      },
      { new: true, runValidators: true }
    )
      .populate("book")
      .populate("branch");

    await recomputeTrend(oldSale.book, oldSale.branch);
    if (String(book) !== String(oldSale.book) || String(branch) !== String(oldSale.branch)) {
      await recomputeTrend(book, branch);
    }

    res.json({
      success: true,
      data: updatedSale,
      message: "Sale updated, inventory adjusted and trend recalculated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;