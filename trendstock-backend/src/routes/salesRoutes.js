const express = require("express");
const router = express.Router();
const Sales = require("../models/Sales");

// POST - add sales record
router.post("/", async (req, res) => {
  try {
    const sale = await Sales.create(req.body);
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sales.find()
      .populate("book")
      .populate("branch");
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;