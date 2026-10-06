const mongoose = require("mongoose");

const Book = require("../models/Book");
const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");
const TrendSignal = require("../models/TrendSignal");
const {
  getPredictionLabel,
  calculateBranchDemandScore,
  calculateTrendScore,
  getCategoryScore,
} = require("./trendCalculator");

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Recalculate and save the trend signal for ONE book at ONE branch.
 * Call this after every sale, stock change, view event or search event.
 */
async function recomputeTrend(bookId, branchId) {
  const book = await Book.findById(bookId);
  if (!book) throw new Error("Book not found");

  const branchObjId = new mongoose.Types.ObjectId(String(branchId));

  // current stock
  const inventory = await Inventory.findOne({ book: book._id, branch: branchObjId });
  const currentStock = inventory ? inventory.quantity : 0;

  // average daily sales over the last 30 days (ending at the latest sale)
  let dailySales = 0;
  const latest = await Sales.findOne({ book: book._id, branch: branchObjId })
    .sort({ saleDate: -1 })
    .select("saleDate");

  if (latest) {
    const end = latest.saleDate;
    const start = new Date(end.getTime() - WINDOW_DAYS * DAY_MS);

    const agg = await Sales.aggregate([
      {
        $match: {
          book: book._id,
          branch: branchObjId,
          saleDate: { $gt: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$quantitySold" } } },
    ]);

    dailySales = (agg[0]?.total || 0) / WINDOW_DAYS;
  }

  const rating = Number(book.rating || 0);
  const viewCount = Number(book.viewCount || 0);
  const searchCount = Number(book.searchCount || 0);
  const categoryScore = getCategoryScore(book.category);

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

  return TrendSignal.findOneAndUpdate(
    { book: book._id, branch: branchObjId },
    {
      book: book._id,
      branch: branchObjId,
      branchDemandScore: round2(branchDemandScore),
      categoryScore,
      trendScore: round2(trendScore),
      prediction,
    },
    { new: true, upsert: true, runValidators: true }
  );
}

module.exports = { recomputeTrend };