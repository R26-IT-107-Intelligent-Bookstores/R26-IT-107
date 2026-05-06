const express = require("express");
const router = express.Router();

const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");
const TrendSignal = require("../models/TrendSignal");
const Book = require("../models/Book");

// helper - generate prediction label
const getPredictionLabel = (trendScore) => {
  if (trendScore >= 80) return "High Demand";
  if (trendScore >= 50) return "Moderate Demand";
  return "Low Demand";
};

// POST - add sales record + reduce inventory + update trend signal
router.post("/", async (req, res) => {
  try {
    const { book, branch, quantitySold, saleDate } = req.body;

    const inventory = await Inventory.findOne({
      book,
      branch,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: "Inventory record not found for this book and branch",
      });
    }

    if (inventory.quantity < quantitySold) {
      return res.status(400).json({
        success: false,
        error: "Not enough stock available",
      });
    }

    const sale = await Sales.create({
      book,
      branch,
      quantitySold,
      saleDate: saleDate || new Date(),
    });

    // reduce inventory after sale
    inventory.quantity -= Number(quantitySold);
    await inventory.save();

    // increase engagement indicators after sale
    const updatedBook = await Book.findByIdAndUpdate(
      book,
      {
        $inc: {
          viewCount: Number(quantitySold) * 5,
          searchCount: Number(quantitySold) * 2,
        },
      },
      { new: true }
    );

    const totalSales = await Sales.aggregate([
      {
        $match: {
          book: inventory.book,
          branch: inventory.branch,
        },
      },
      {
        $group: {
          _id: null,
          totalQuantitySold: { $sum: "$quantitySold" },
        },
      },
    ]);

    const dailySales = totalSales[0]?.totalQuantitySold || Number(quantitySold);
    const currentStock = inventory.quantity;
    const rating = updatedBook.rating || 4.0;
    const viewCount = updatedBook.viewCount || 0;
    const searchCount = updatedBook.searchCount || 0;

    const branchDemandScore =
      dailySales * 2 +
      viewCount * 0.03 +
      searchCount * 0.2 +
      rating * 10;

    const trendScore =
      dailySales * 0.4 +
      viewCount * 0.02 +
      searchCount * 0.1 +
      rating * 10 +
      branchDemandScore * 0.2 -
      currentStock * 0.1;

    const prediction = getPredictionLabel(trendScore);

    const reason =
      prediction === "High Demand"
        ? "High sales activity, strong engagement indicators, and reduced stock level"
        : prediction === "Moderate Demand"
        ? "Moderate sales and engagement activity detected"
        : "Demand indicators are still low compared to available stock";

    const trendSignal = await TrendSignal.findOneAndUpdate(
      {
        book,
        branch,
      },
      {
        book,
        branch,
        trendScore,
        prediction,
        reason,
      },
      {
        new: true,
        upsert: true,
      }
    );

    const populatedSale = await Sales.findById(sale._id)
      .populate("book")
      .populate("branch");

    res.status(201).json({
      success: true,
      data: populatedSale,
      updatedInventory: inventory,
      trendSignal,
      message: "Sale recorded, inventory updated, and trend signal generated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sales.find()
      .populate("book")
      .populate("branch")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;