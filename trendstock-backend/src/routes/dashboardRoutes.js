const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");
const TrendSignal = require("../models/TrendSignal");
const Book = require("../models/Book");

// GET - overall dashboard summary (all branches combined)
// This handles requests to /dashboard (no branch id) — used by the
// TrendStock landing page's "Overview" cards.
router.get("/", async (req, res) => {
  try {
    const branches = await Branch.find();
    const totalBooks = await Book.countDocuments();

    const salesAgg = await Sales.aggregate([
      { $group: { _id: null, totalUnitsSold: { $sum: "$quantitySold" } } },
    ]);
    const totalUnitsSold = salesAgg[0]?.totalUnitsSold || 0;

    const highDemandCount = await TrendSignal.countDocuments({
      prediction: "High Demand",
    });

    res.json({
      totalBranches: branches.length,
      totalBooks,
      totalUnitsSold,
      highDemandCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - branch dashboard summary
// This handles requests to /dashboard/:branchId — used when viewing
// a single branch's detail page.
router.get("/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    const threshold = 10;

    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const inventoryItems = await Inventory.find({ branch: branchId })
      .populate("book")
      .populate("branch");

    const lowStockItems = inventoryItems.filter(
      (item) => item.quantity < threshold
    );

    const recommendations = lowStockItems.map((item) => ({
      inventoryId: item._id,
      bookTitle: item.book?.title,
      currentQuantity: item.quantity,
      recommendedAction: "Restock",
      recommendedQuantity: threshold - item.quantity + 10
    }));

    res.json({
      branch,
      totalInventoryItems: inventoryItems.length,
      lowStockCount: lowStockItems.length,
      inventoryItems,
      lowStockItems,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;