const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// category-based baseline indicators for new books
const categoryDefaults = {
  Fantasy: { rating: 4.5, viewCount: 700, searchCount: 180 },
  Thriller: { rating: 4.3, viewCount: 500, searchCount: 120 },
  Novel: { rating: 4.1, viewCount: 400, searchCount: 90 },
  Academic: { rating: 3.8, viewCount: 200, searchCount: 40 },
  Children: { rating: 4.4, viewCount: 600, searchCount: 150 },
  Translation: { rating: 4.2, viewCount: 450, searchCount: 100 },
};

const getCategoryDefaults = (category) => {
  return (
    categoryDefaults[category] || {
      rating: 4.0,
      viewCount: 300,
      searchCount: 60,
    }
  );
};

// POST - add new book with default demand indicators
router.post("/", async (req, res) => {
  try {
    const defaults = getCategoryDefaults(req.body.category);

    const book = await Book.create({
      ...req.body,
      rating: req.body.rating ?? defaults.rating,
      viewCount: req.body.viewCount ?? defaults.viewCount,
      searchCount: req.body.searchCount ?? defaults.searchCount,
    });

    res.status(201).json({
      success: true,
      data: book,
      message: "Book created with demand indicators",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - get all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET - get one book by id
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT - update book
router.put("/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      data: updatedBook,
      message: "Book updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE - delete book
router.delete("/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;