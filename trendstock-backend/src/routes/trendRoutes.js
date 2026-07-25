const { spawn } = require("child_process");
const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const TrendSignal = require("../models/TrendSignal");
const Sales = require("../models/Sales");
const Book = require("../models/Book");
const Inventory = require("../models/Inventory");

// helper - prediction label
const getPredictionLabel = (trendScore) => {
  if (trendScore >= 80) return "High Demand";
  if (trendScore >= 50) return "Moderate Demand";
  return "Low Demand";
};

// helper - calculate branch demand score
const calculateBranchDemandScore = ({
  dailySales,
  viewCount,
  searchCount,
  rating,
}) => {
  return (
    dailySales * 2 +
    viewCount * 0.03 +
    searchCount * 0.2 +
    rating * 10
  );
};

// helper - calculate final trend score
const calculateTrendScore = ({
  dailySales,
  viewCount,
  searchCount,
  rating,
  branchDemandScore,
  currentStock,
  categoryScore,
}) => {
  return (
    dailySales * 0.4 +
    viewCount * 0.02 +
    searchCount * 0.1 +
    rating * 10 +
    branchDemandScore * 0.2 +
    categoryScore * 0.1 -
    currentStock * 0.1
  );
};

// helper - category baseline score
const getCategoryScore = (category = "") => {
  const categoryText = category.toLowerCase();

  if (
    categoryText.includes("fantasy") ||
    categoryText.includes("යොවුන්") ||
    categoryText.includes("sci-fi") ||
    categoryText.includes("science fiction") ||
    categoryText.includes("විද්‍යා ප්‍රබන්ධ")
  ) {
    return 85;
  }

  if (
    categoryText.includes("thriller") ||
    categoryText.includes("crime") ||
    categoryText.includes("mystery") ||
    categoryText.includes("detective") ||
    categoryText.includes("රහස්") ||
    categoryText.includes("ත්‍රාසජනක")
  ) {
    return 80;
  }

  if (
    categoryText.includes("novel") ||
    categoryText.includes("fiction") ||
    categoryText.includes("නවකතා")
  ) {
    return 70;
  }

  if (
    categoryText.includes("business") ||
    categoryText.includes("ව්‍යාපාර")
  ) {
    return 75;
  }

  if (
    categoryText.includes("education") ||
    categoryText.includes("educational") ||
    categoryText.includes("අධ්‍යාපන")
  ) {
    return 65;
  }

  if (
    categoryText.includes("children") ||
    categoryText.includes("ළමා")
  ) {
    return 60;
  }

  if (
    categoryText.includes("history") ||
    categoryText.includes("ඉතිහාස")
  ) {
    return 60;
  }

  if (
    categoryText.includes("buddhist") ||
    categoryText.includes("buddhism") ||
    categoryText.includes("බෞද්ධ")
  ) {
    return 55;
  }

  return 50;
};

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
 * Powers the "Sales Trend" line chart on the branch detail page.
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

module.exports = router;