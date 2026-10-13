const { spawn } = require("child_process");
const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const TrendSignal = require("../models/TrendSignal");
const Sales = require("../models/Sales");
const Book = require("../models/Book");
const Inventory = require("../models/Inventory");
const {
  getPredictionLabel,
  calculateBranchDemandScore,
  calculateTrendScore,
  getCategoryScore,
} = require("../services/trendCalculator");

// POST - manually add/update trend signal
router.post("/signals", async (req, res) => {
  try {
    const { book, branch, reviewScore } = req.body;

    const selectedBook = await Book.findById(book);

    if (!selectedBook) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    const inventory = await Inventory.findOne({ book, branch });

    const totalSales = await Sales.aggregate([
      {
        $match: {
          book: selectedBook._id,
          branch: inventory?.branch || branch,
        },
      },
      {
        $group: {
          _id: null,
          totalQuantitySold: { $sum: "$quantitySold" },
        },
      },
    ]);

    const dailySales = totalSales[0]?.totalQuantitySold || 0;
    const currentStock = inventory ? inventory.quantity : 0;
    const rating = Number(selectedBook.rating || reviewScore || 0);
    const viewCount = Number(selectedBook.viewCount || 0);
    const searchCount = Number(selectedBook.searchCount || 0);
    const categoryScore = getCategoryScore(selectedBook.category);

    const branchDemandScore = calculateBranchDemandScore({
      dailySales,
      viewCount,
      searchCount,
      rating,
    });

    const trendScore = calculateTrendScore({
      dailySales,
      viewCount,
      searchCount,
      rating,
      branchDemandScore,
      currentStock,
      categoryScore,
    });

    const prediction = getPredictionLabel(trendScore);

    const trend = await TrendSignal.findOneAndUpdate(
      { book, branch },
      {
        book,
        branch,
        branchDemandScore,
        categoryScore,
        trendScore,
        prediction,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
      .populate("book")
      .populate("branch");

    res.status(201).json({
      success: true,
      data: trend,
      message: "Trend signal calculated and saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - all signals
router.get("/signals", async (req, res) => {
  try {
    const data = await TrendSignal.find()
      .populate("book")
      .populate("branch")
      .sort({ updatedAt: -1 });

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

// GET - predictions only
router.get("/predict", async (req, res) => {
  try {
    const data = await TrendSignal.find({
      prediction: { $in: ["High Demand", "Moderate Demand"] },
    })
      .populate("book")
      .populate("branch")
      .sort({ trendScore: -1 });

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

// GET - ML model prediction
router.get("/ml-predict", async (req, res) => {
  try {
    const pythonScript = path.join(__dirname, "../../ml-service/predict.py");

    const pythonProcess = spawn("py", [pythonScript], {
      cwd: path.join(__dirname, "../../ml-service"),
    });

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

      const prediction = result.trim();

      res.json({
        success: true,
        prediction,
        status: prediction,
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
          category: sale.book.category || "Uncategorized",
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

/**
 * GET /api/trends/branch/:branchId
 * Everything needed for the branch detail page (click-through from the
 * 3 branch cards on the dashboard):
 *  - top trending books at this branch, sorted by trendScore (desc)
 *  - current stock for each book at this branch
 *  - total units sold (all-time / full year) per book at this branch
 */
router.get("/branch/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;

    // all trend signals for this branch, highest score first
    const trends = await TrendSignal.find({ branch: branchId })
      .populate("book")
      .sort({ trendScore: -1 });

    // build a book -> current stock lookup for this branch
    const inventories = await Inventory.find({ branch: branchId });
    const stockMap = {};
    inventories.forEach((inv) => {
      stockMap[inv.book.toString()] = inv.quantity;
    });

    // total units sold per book at this branch (all-time / full year)
    const salesAgg = await Sales.aggregate([
      { $match: { branch: new mongoose.Types.ObjectId(branchId) } },
      { $group: { _id: "$book", totalSold: { $sum: "$quantitySold" } } },
    ]);
    const salesMap = {};
    salesAgg.forEach((s) => {
      salesMap[s._id.toString()] = s.totalSold;
    });

    const books = trends.map((t) => ({
      bookId: t.book?._id,
      title: t.book?.title,
      author: t.book?.author,
      category: t.book?.category,
      trendScore: t.trendScore,
      prediction: t.prediction,
      currentStock: stockMap[t.book?._id.toString()] ?? 0,
      totalSold: salesMap[t.book?._id.toString()] ?? 0,
    }));

    res.json({
      success: true,
      data: {
        branchId,
        totalBooks: books.length,
        highDemandCount: books.filter((b) => b.prediction === "High Demand").length,
        books,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trends/branch/:branchId/book/:bookId/monthly
 * Monthly sales totals for one book at one branch across the full year.
 * (Kept for potential future use, e.g. per-book drill-down.)
 */
router.get("/branch/:branchId/book/:bookId/monthly", async (req, res) => {
  try {
    const { branchId, bookId } = req.params;

    const agg = await Sales.aggregate([
      {
        $match: {
          branch: new mongoose.Types.ObjectId(branchId),
          book: new mongoose.Types.ObjectId(bookId),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
          totalSold: { $sum: "$quantitySold" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = agg.map((a) => ({ month: a._id, totalSold: a.totalSold }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/trends/branch/:branchId/monthly
 * Total sales across ALL books at one branch, by month, for the full year.
 * Powers the "Sales Trend" line chart on the branch detail page (branch-wide view).
 */
router.get("/branch/:branchId/monthly", async (req, res) => {
  try {
    const { branchId } = req.params;

    const agg = await Sales.aggregate([
      {
        $match: {
          branch: new mongoose.Types.ObjectId(branchId),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
          totalSold: { $sum: "$quantitySold" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = agg.map((a) => ({ month: a._id, totalSold: a.totalSold }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;