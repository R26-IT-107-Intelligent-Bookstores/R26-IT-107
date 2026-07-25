const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const Sales = require("../models/Sales");
const TrendSignal = require("../models/TrendSignal");

// POST - create branch
router.post("/", async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - all branches
router.get("/", async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/branches/summary
 * Quick stats for each branch, used for the 3 landing dashboard cards
 * (Colombo / Kandy / Galle) before the user clicks into one.
 *
 */
router.get("/summary", async (req, res) => {
  try {
    const branches = await Branch.find();

    const summary = await Promise.all(
      branches.map(async (branch) => {
        // total units sold at this branch (all-time, across the full year)
        const salesAgg = await Sales.aggregate([
          { $match: { branch: branch._id } },
          { $group: { _id: null, totalSold: { $sum: "$quantitySold" } } },
        ]);
        const totalSold = salesAgg[0]?.totalSold || 0;

        // top trending book at this branch (highest trendScore)
        const topTrend = await TrendSignal.findOne({ branch: branch._id })
          .sort({ trendScore: -1 })
          .populate("book");

        // how many distinct books have a trend signal at this branch
        const bookCount = await TrendSignal.countDocuments({ branch: branch._id });

        // count of high-demand books at this branch
        const highDemandCount = await TrendSignal.countDocuments({
          branch: branch._id,
          prediction: "High Demand",
        });

        return {
          branchId: branch._id,
          name: branch.name,
          totalSold,
          bookCount,
          highDemandCount,
          topBook: topTrend
            ? {
                title: topTrend.book?.title,
                trendScore: topTrend.trendScore,
                prediction: topTrend.prediction,
              }
            : null,
        };
      })
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - one branch by id
router.get("/:id", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - update branch
router.put("/:id", async (req, res) => {
  try {
    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(updatedBranch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - delete branch
router.delete("/:id", async (req, res) => {
  try {
    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);

    if (!deletedBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;