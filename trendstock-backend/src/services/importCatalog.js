const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Book = require("../models/Book");
const Branch = require("../models/Branch");
const Inventory = require("../models/Inventory");

const DRY = process.argv.includes("--dry");
const FILE = path.join(__dirname, "../../../phonolex-backend/real_books_dataset.json");

const digits = (s) => String(s || "").replace(/[^0-9Xx]/g, "").toUpperCase();

// small deterministic hash so the same book always gets the same starting stock
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

(async () => {
  await connectDB();

  let raw = fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, "");
  let rows = JSON.parse(raw);
  if (!Array.isArray(rows)) rows = rows.books || [];

  // 1. clean: need a title and a valid ISBN; keep the first row of each ISBN
  const seen = new Set();
  const clean = [];
  let noIsbn = 0;
  let dupes = 0;
  for (const r of rows) {
    const d = digits(r.isbn);
    if (!r.title || d.length < 10) { noIsbn++; continue; }
    if (seen.has(d)) { dupes++; continue; }
    seen.add(d);
    clean.push({ r, d });
  }

  // 2. split into already-in-database and new
  const existing = await Book.find().select("isbn");
  const existingSet = new Set(existing.map((b) => digits(b.isbn)));
  const fresh = clean.filter((x) => !existingSet.has(x.d));

  console.log("Rows in file:           ", rows.length);
  console.log("Skipped (no/bad ISBN):  ", noIsbn);
  console.log("Skipped (duplicate):    ", dupes);
  console.log("Already in TrendStock:  ", clean.length - fresh.length);
  console.log("NEW books to add:       ", fresh.length);

  const branches = await Branch.find();
  console.log("Branches:               ", branches.map((b) => b.name).join(", "));

  if (DRY) {
    console.log("\nDRY RUN: nothing was written.");
    await mongoose.connection.close();
    return;
  }

  // 3. add the new books (views and searches start at 0: only real events change them)
  const docs = fresh.map(({ r }) => ({
    bookId: r.book_id,
    title: String(r.title),
    author: r.author || "Unknown",
    category: r.category || "Uncategorized",
    price: Number(r.price) || 0,
    isbn: r.isbn,
    coverImageUrl: r.cover_image_url || "",
    inStock: r.in_stock === true,
    viewCount: 0,
    searchCount: 0,
    rating: Math.min(5, Math.max(0, Number(r.rating) || 0)),
    searchTags: Array.isArray(r.search_tags) ? r.search_tags.join(", ") : String(r.search_tags || ""),
  }));
  const inserted = await Book.insertMany(docs, { ordered: false });
  console.log("Books added:            ", inserted.length);

  // 4. starting stock at every branch (whole numbers)
  const inv = [];
  for (const b of inserted) {
    const inStock = b.inStock;
    for (const br of branches) {
      const qty = inStock ? 20 + Math.floor(hash(String(b.isbn) + br.name) * 100) : 0;
      inv.push({ book: b._id, branch: br._id, quantity: qty });
    }
  }
  await Inventory.insertMany(inv, { ordered: false });
  console.log("Inventory rows added:   ", inv.length);

  await mongoose.connection.close();
  console.log("Done.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});