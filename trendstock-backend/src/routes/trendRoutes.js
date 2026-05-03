const express = require("express");
const router = express.Router();
const TrendSignal = require("../models/TrendSignal");

// POST - add trend signal
router.post("/signals", async (req, res) => {
  try {
    const {
      book,
      branch,
      socialMediaScore,
      eventScore,
      salesScore,
      reviewScore,
      branchDemandScore,
    } = req.body;

    // calculate trend score
    const trendScore =
      socialMediaScore * 0.4 +
      salesScore * 0.25 +
      reviewScore * 0.15 +
      eventScore * 0.1 +
      branchDemandScore * 0.1;

    // prediction logic
    let prediction = "Low Demand";
    if (trendScore > 70) prediction = "High Demand";
    else if (trendScore > 40) prediction = "Moderate Demand";

    const trend = await TrendSignal.create({
      book,
      branch,
      socialMediaScore,
      eventScore,
      salesScore,
      reviewScore,
      branchDemandScore,
      trendScore,
      prediction,
    });

    res.status(201).json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - all signals
router.get("/signals", async (req, res) => {
  try {
    const data = await TrendSignal.find()
      .populate("book")
      .populate("branch");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - predictions only
router.get("/predict", async (req, res) => {
  try {
    const data = await TrendSignal.find({
      prediction: { $in: ["High Demand", "Moderate Demand"] },
    }).populate("book branch");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;