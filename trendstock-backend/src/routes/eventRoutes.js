const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Book = require("../models/Book");
const Inventory = require("../models/Inventory");
const { recomputeTrend } = require("../services/recomputeTrend");

// remembers recent events so one refresh or repeated search is not counted twice
const recent = new Map();
const DEDUPE_MS = 30 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, time] of recent) {
    if (now - time > DEDUPE_MS) recent.delete(key);
  }
}, 60 * 1000).unref();

// POST /api/events
// body: { "type": "search" | "view", "bookIds": [...] and/or "isbns": [...], "sessionId": "abc" }
router.post("/", async (req, res) => {
  try {
    const { type, sessionId } = req.body;
    const bookIds = Array.isArray(req.body.bookIds) ? req.body.bookIds : [];
    const isbns = Array.isArray(req.body.isbns) ? req.body.isbns : [];

    if (!["search", "view"].includes(type)) {
      return res.status(400).json({ success: false, error: 'type must be "search" or "view"' });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }
    if (bookIds.length + isbns.length === 0 || bookIds.length + isbns.length > 20) {
      return res.status(400).json({ success: false, error: "send between 1 and 20 bookIds or isbns" });
    }

    // find the books by _id or ISBN
    const validIds = bookIds.filter((id) => mongoose.isValidObjectId(id));
    const books = await Book.find({
      $or: [{ _id: { $in: validIds } }, { isbn: { $in: isbns.map(String) } }],
    }).select("_id");

    const field = type === "search" ? "searchCount" : "viewCount";
    const counted = [];
    const skipped = [];

    for (const book of books) {
      const key = `${sessionId}:${type}:${book._id}`;
      const last = recent.get(key);
      if (last && Date.now() - last < DEDUPE_MS) {
        skipped.push(book._id);
        continue;
      }
      recent.set(key, Date.now());

      await Book.updateOne({ _id: book._id }, { $inc: { [field]: 1 } });
      counted.push(book._id);
    }

    // refresh the trend score at every branch that stocks these books
    for (const bookId of counted) {
      const rows = await Inventory.find({ book: bookId }).select("branch");
      for (const row of rows) {
        await recomputeTrend(bookId, row.branch);
      }
    }

    res.status(201).json({
      success: true,
      counted: counted.length,
      skippedDuplicates: skipped.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;