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
const NEUTRAL_RATING = 3.5; // used when a book has no rating yet

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

  // average daily sales over the book's 30 most recent selling days.
  // (Using selling days instead of calendar days means a new sale is added to
  // the book's recent history instead of starting an empty 30-day window,
  // which happened when the stored history ended in the past.)
  const recentDays = await Sales.aggregate([
    { $match: { book: book._id, branch: branchObjId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
        units: { $sum: "$quantitySold" },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: WINDOW_DAYS },
  ]);
  const dailySales =
    recentDays.reduce((sum, d) => sum + d.units, 0) / WINDOW_DAYS;

  // unrated books get a neutral rating instead of 0, so missing data is not
  // mistaken for low demand
  const storedRating = Number(book.rating || 0);
  const rating = storedRating > 0 ? storedRating : NEUTRAL_RATING;

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