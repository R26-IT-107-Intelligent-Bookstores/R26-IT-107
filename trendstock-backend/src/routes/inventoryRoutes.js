const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");

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

  // GET - restock recommendations
router.get("/recommendations/restock", async (req, res) => {
    try {
      const threshold = 10;
  
      const items = await Inventory.find({
        quantity: { $lt: threshold }
      })
        .populate("book")
        .populate("branch");
  
        const recommendations = items.map((item) => {
          let action = "Sufficient";
          let recommendedQty = 0;
        
          if (item.quantity < 5) {
            action = "Urgent Restock";
            recommendedQty = 20;
          } else if (item.quantity < 10) {
            action = "Restock Soon";
            recommendedQty = 10;
          }
        
          return {
            inventoryId: item._id,
            bookTitle: item.book?.title,
            branchName: item.branch?.name,
            currentQuantity: item.quantity,
            recommendedAction: action,
            recommendedQuantity: recommendedQty
          };
        });
  
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;