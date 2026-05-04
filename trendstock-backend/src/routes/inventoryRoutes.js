const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const TrendSignal = require("../models/TrendSignal");

// POST - add inventory
router.post("/", async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - all inventory
router.get("/", async (req, res) => {
  try {
    const data = await Inventory.find()
      .populate("book")
      .populate("branch");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - low stock items
router.get("/low-stock", async (req, res) => {
    try {
      const threshold = 10; // you can change this
  
      const lowStockItems = await Inventory.find({
        quantity: { $lt: threshold }
      })
        .populate("book")
        .populate("branch");
  
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// GET - smart restock recommendations using inventory + trend prediction
router.get("/recommendations/restock", async (req, res) => {
  try {
    const threshold = 10;

    const items = await Inventory.find()
      .populate("book")
      .populate("branch");

    const recommendations = await Promise.all(
      items.map(async (item) => {
        const trend = await TrendSignal.findOne({
          book: item.book?._id,
          branch: item.branch?._id,
        }).sort({ createdAt: -1 });

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

        if (trend && trend.prediction === "High Demand") {
          action = item.quantity < threshold ? "Urgent Restock" : "Increase Safety Stock";
          recommendedQty = recommendedQty || 15;
          reason = "Book is predicted to have high demand";
        }

        return {
          inventoryId: item._id,
          bookTitle: item.book?.title,
          branchName: item.branch?.name,
          currentQuantity: item.quantity,
          trendScore: trend ? trend.trendScore : 0,
          prediction: trend ? trend.prediction : "No trend data",
          recommendedAction: action,
          recommendedQuantity: recommendedQty,
          reason,
        };
      })
    );

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;