const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const Inventory = require("../models/Inventory");

// GET - branch dashboard summary
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