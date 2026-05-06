const { spawn } = require("child_process");
const path = require("path");
const express = require("express");
const router = express.Router();
const TrendSignal = require("../models/TrendSignal");
const Sales = require("../models/Sales");

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

// GET - ML model prediction
router.get("/ml-predict", async (req, res) => {
  try {
    const pythonScript = path.join(
      __dirname,
      "../../ml-service/predict.py"
    );

    const pythonProcess = spawn("py", [pythonScript]);

    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", () => {
      if (error) {
        return res.status(500).json({
          success: false,
          error,
        });
      }

      const predictionValue = result.includes("1") ? 1 : 0;

      res.json({
        success: true,
        prediction: predictionValue,
        status: predictionValue === 1 ? "Trending" : "Not Trending",
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - top trending books branch-wise based on sales
router.get("/top", async (req, res) => {
  try {
    const sales = await Sales.find()
      .populate("book")
      .populate("branch");

    const trendMap = {};

    sales.forEach((sale) => {
      if (!sale.book || !sale.branch) return;

      const key = `${sale.book._id}_${sale.branch._id}`;

      if (!trendMap[key]) {
        trendMap[key] = {
          bookId: sale.book._id,
          title: sale.book.title,
          author: sale.book.author,
          branchId: sale.branch._id,
          branchName: sale.branch.name,
          totalSold: 0,
        };
      }

      trendMap[key].totalSold += sale.quantitySold;
    });

    const topBooks = Object.values(trendMap)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    res.json({
      success: true,
      data: topBooks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
module.exports = router;