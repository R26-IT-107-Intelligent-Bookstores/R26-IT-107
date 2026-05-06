const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const TrendSignal = require("../models/TrendSignal");

console.log("Inventory routes loaded");

// POST - add inventory
router.post("/", async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      data: inventory,
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

    res.json({
      success: true,
      data,
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
      .populate("branch");

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

// GET - smart restock recommendations using inventory + trend prediction
router.get("/recommendations/restock", async (req, res) => {
  try {
    const threshold = 10;

    const items = await Inventory.find()
  .populate("book")
  .populate("branch")
  .sort({ createdAt: -1 });

    const recommendations = await Promise.all(
      items.map(async (item) => {
        const trend = await TrendSignal.findOne({
          book: item.book?._id,
          branch: item.branch?._id,
        }).sort({ createdAt: -1 });

        const prediction = trend ? trend.prediction : "No trend data";
        const trendScore = trend ? trend.trendScore : 0;

        let action = "Sufficient Stock";
        let recommendedQty = 0;
        let reason = "Stock level is sufficient";

        if (item.quantity < 5) {
          action = "Urgent Restock";
          recommendedQty = 20;
          reason = "Inventory is critically low";
        } else if (item.quantity < threshold) {
          action = "Restock";
          recommendedQty = threshold - item.quantity + 10;
          reason = "Inventory is below threshold";
        }

        if (prediction === "High Demand") {
          if (item.quantity < threshold) {
            action = "Urgent Restock";
            recommendedQty = 25;
            reason = "High demand prediction and low stock";
          } else {
            action = "Increase Safety Stock";
            recommendedQty = 15;
            reason = "Book is predicted to have high demand";
          }
        }

        return {
          inventoryId: item._id,
          bookTitle: item.book?.title,
          branchName: item.branch?.name,
          currentQuantity: item.quantity,
          trendScore,
          prediction,
          recommendedAction: action,
          recommendedQuantity: recommendedQty,
          reason,
        };
      })
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
    );

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