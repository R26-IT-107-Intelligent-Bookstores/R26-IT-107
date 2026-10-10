const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const TrendSignal = require("../models/TrendSignal");

console.log("Inventory routes loaded");

// POST - add inventory
router.post("/", async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);

    const populatedInventory = await Inventory.findById(inventory._id)
      .populate("book")
      .populate("branch");

    res.status(201).json({
      success: true,
      data: populatedInventory,
      message: "Inventory added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - all inventory
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate("book")
      .populate("branch")
      .sort({ createdAt: -1 });

    const roundedItems = items.map((item) => {
      const obj = item.toObject();
      obj.quantity = Math.round(obj.quantity);
      return obj;
    });

    res.json({
      success: true,
      data: roundedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - low stock items
router.get("/low-stock", async (req, res) => {
  try {
    const threshold = 10;

    const lowStockItems = await Inventory.find({
      quantity: { $lt: threshold },
    })
      .populate("book")
      .populate("branch")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: lowStockItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - smart restock recommendations
// Optional query: ?branch=<branchId>  (only that branch's items)
// Uses the saved TrendSignal label (same as Overview / Trending Books tabs).
const VALID_PREDICTIONS = ["High Demand", "Moderate Demand", "Low Demand"];

// same cut-offs as getPredictionLabel() in trendRoutes.js
const labelFromScore = (score) => {
  if (score >= 80) return "High Demand";
  if (score >= 50) return "Moderate Demand";
  return "Low Demand";
};

// fallback for books that have no TrendSignal yet
const estimateScore = (item) => {
  const currentStock = Number(item.quantity || 0);
  const rating = Number(item.book?.rating || 3.5);
  const viewCount = Number(item.book?.viewCount || 0);
  const searchCount = Number(item.book?.searchCount || 0);

  let score = rating * 10 + viewCount * 0.03 + searchCount * 0.08;
  if (currentStock < 10) score += 20;
  else if (currentStock < 30) score += 10;
  return Math.min(score, 100);
};

const ACTION_PRIORITY = {
  "Urgent Restock": 0,
  "Increase Safety Stock": 1,
  Restock: 2,
  "Sufficient Stock": 3,
};
const PREDICTION_PRIORITY = { "High Demand": 0, "Moderate Demand": 1, "Low Demand": 2 };

router.get("/recommendations/restock", async (req, res) => {
  try {
    const threshold = 10;
    const filter = {};
    if (req.query.branch) filter.branch = req.query.branch;

    const items = await Inventory.find(filter)
      .populate("book")
      .populate("branch")
      .lean();

    // load all trend signals once
    const signals = await TrendSignal.find(filter)
      .sort({ updatedAt: -1 })
      .lean();
    const signalMap = new Map();
    for (const sig of signals) {
      const key = `${sig.book}_${sig.branch}`;
      if (!signalMap.has(key)) signalMap.set(key, sig); // keep the newest
    }

    const recommendations = items.map((item) => {
      const signal = signalMap.get(`${item.book?._id}_${item.branch?._id}`);

      let trendScore = signal ? Number(signal.trendScore) : NaN;
      let prediction = signal?.prediction;

      if (!Number.isFinite(trendScore) || trendScore < 0) {
        trendScore = estimateScore(item);
      }
      if (!VALID_PREDICTIONS.includes(prediction)) {
        prediction = labelFromScore(trendScore);
      }

      const quantity = Number(item.quantity || 0);
      let action = "Sufficient Stock";
      let recommendedQty = 0;
      let reason = "Current stock is enough, no restock needed";

      // low stock conditions
      if (quantity < 5) {
        action = "Urgent Restock";
        recommendedQty = 25;
        reason = "Inventory is critically low";
      } else if (quantity < threshold) {
        action = "Restock";
        recommendedQty = threshold - quantity + 10;
        reason = "Inventory is below minimum threshold";
      }

      // high demand logic
      if (prediction === "High Demand") {
        if (quantity < 20) {
          action = "Urgent Restock";
          recommendedQty = 30;
          reason = "High demand prediction with limited stock";
        } else {
          action = "Increase Safety Stock";
          recommendedQty = 15;
          reason = "Book is predicted to have high demand";
        }
      }

      return {
        inventoryId: item._id,
        bookTitle: item.book?.title || "-",
        branchId: item.branch?._id,
        branchName: item.branch?.name || "-",
        currentQuantity: Math.round(quantity),
        trendScore: Number(trendScore.toFixed(2)),
        prediction,
        recommendedAction: action,
        recommendedQuantity: recommendedQty,
        reason,
      };
    });

    // most urgent first, then High > Moderate > Low, then highest trend score
    recommendations.sort(
      (a, b) =>
        ACTION_PRIORITY[a.recommendedAction] - ACTION_PRIORITY[b.recommendedAction] ||
        PREDICTION_PRIORITY[a.prediction] - PREDICTION_PRIORITY[b.prediction] ||
        b.trendScore - a.trendScore
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT - update inventory
router.put("/:id", async (req, res) => {
  try {
    const updatedInventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("book")
      .populate("branch");

    if (!updatedInventory) {
      return res.status(404).json({
        success: false,
        error: "Inventory record not found",
      });
    }

    res.json({
      success: true,
      data: updatedInventory,
      message: "Inventory updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE - delete inventory
router.delete("/:id", async (req, res) => {
  try {
    const deletedInventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!deletedInventory) {
      return res.status(404).json({
        success: false,
        error: "Inventory record not found",
      });
    }

    res.json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;