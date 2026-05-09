const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
    },
    isbn: {
      type: String,
    },
    coverImageUrl: {
      type: String,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    searchTags: {
      type: String,
    },
    searchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);