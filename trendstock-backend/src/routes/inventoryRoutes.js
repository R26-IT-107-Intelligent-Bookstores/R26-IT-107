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

    res.json({
      success: true,
      data: items,
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

        let trendScore = trend ? Number(trend.trendScore) : 0;

        // remove unrealistic values
        if (
          !Number.isFinite(trendScore) ||
          trendScore < 0 ||
          trendScore > 150
        ) {
          trendScore = 0;
        }

        // realistic fallback score
        if (trendScore === 0) {
          const currentStock = Number(item.quantity || 0);
          const rating = Number(item.book?.rating || 3.5);
          const viewCount = Number(item.book?.viewCount || 0);
          const searchCount = Number(item.book?.searchCount || 0);

          // balanced calculation
          trendScore =
            rating * 10 +
            viewCount * 0.03 +
            searchCount * 0.08;

          // stock effect
          if (currentStock < 10) {
            trendScore += 20;
          } else if (currentStock < 30) {
            trendScore += 10;
          }

          // normalize
          if (trendScore > 100) trendScore = 100;
        }

        // prediction logic
        let prediction = "Low Demand";

        if (trendScore >= 75) {
          prediction = "High Demand";
        } else if (trendScore >= 45) {
          prediction = "Moderate Demand";
        }

        // recommendation logic
        let action = "Sufficient Stock";
        let recommendedQty = 0;
        let reason = "Current stock is enough, no restock needed";

        // low stock conditions
        if (item.quantity < 5) {
          action = "Urgent Restock";
          recommendedQty = 25;
          reason = "Inventory is critically low";
        } else if (item.quantity < threshold) {
          action = "Restock";
          recommendedQty = threshold - item.quantity + 10;
          reason = "Inventory is below minimum threshold";
        }

        // high demand logic
        if (prediction === "High Demand") {
          if (item.quantity < 20) {
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
          branchName: item.branch?.name || "-",
          currentQuantity: item.quantity,
          trendScore: Number(trendScore.toFixed(2)),
          prediction,
          recommendedAction: action,
          recommendedQuantity: recommendedQty,
          reason,
        };
      })
    );

    // NO SORTING
    // keeps mixed High / Moderate / Low demand books naturally

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