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

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/events
// body: { "type": "search" | "view", "sessionId": "abc",
//         and ONE OR MORE OF: "query": "typed text", "bookIds": [...], "isbns": [...] }
router.post("/", async (req, res) => {
  try {
    const { type, sessionId } = req.body;
    const bookIds = Array.isArray(req.body.bookIds) ? req.body.bookIds : [];
    const isbns = Array.isArray(req.body.isbns) ? req.body.isbns : [];
    const query = typeof req.body.query === "string" ? req.body.query.trim() : "";

    if (!["search", "view"].includes(type)) {
      return res.status(400).json({ success: false, error: 'type must be "search" or "view"' });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }
    if (bookIds.length + isbns.length > 20) {
      return res.status(400).json({ success: false, error: "send at most 20 bookIds or isbns" });
    }
    if (bookIds.length + isbns.length === 0 && query.length < 2) {
      return res.status(400).json({
        success: false,
        error: "send a query (2+ characters), or bookIds, or isbns",
      });
    }

    // find the books: by _id, by ISBN, or by title match on the typed text
    const validIds = bookIds.filter((id) => mongoose.isValidObjectId(id));
    const conditions = [];
    if (validIds.length) conditions.push({ _id: { $in: validIds } });
    if (isbns.length) conditions.push({ isbn: { $in: isbns.map(String) } });

    let books = [];
    if (conditions.length) {
      books = await Book.find({ $or: conditions }).select("_id");
    }
    if (query.length >= 2) {
      const matched = await Book.find({
        title: { $regex: escapeRegex(query), $options: "i" },
      })
        .limit(10)
        .select("_id");
      const seen = new Set(books.map((b) => String(b._id)));
      for (const b of matched) if (!seen.has(String(b._id))) books.push(b);
    }

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
      matchedBooks: books.length,
      counted: counted.length,
      skippedDuplicates: skipped.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
