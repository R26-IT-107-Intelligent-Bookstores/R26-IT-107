// trendstock-backend/src/services/exportMonthly.js
// Exports monthly sales per book-branch to src/services/ml/monthly_sales.csv
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Sales = require("../models/Sales");
const Book = require("../models/Book");

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
  if (!uri) {
    console.error("No Mongo URI found in .env (looked for MONGO_URI, MONGODB_URI, MONGO_URL, DATABASE_URL).");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected");

  const rows = await Sales.aggregate([
    {
      $group: {
        _id: {
          book: "$book",
          branch: "$branch",
          month: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
        },
        units: { $sum: "$quantitySold" },
      },
    },
  ]).allowDiskUse(true);
  console.log("Monthly groups:", rows.length);

  const books = await Book.find({}, "bookId category price rating").lean();
  const meta = new Map(books.map((b) => [String(b._id), b]));

  const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const lines = ["book_id,branch,category,price,rating,month,units"];
  for (const r of rows) {
    const b = meta.get(String(r._id.book));
    if (!b) continue;
    lines.push(
      [esc(b.bookId), esc(r._id.branch), esc(b.category), b.price ?? 0, b.rating ?? 0, r._id.month, r.units].join(",")
    );
  }

  const dir = path.join(__dirname, "..", "..", "ml-service");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "monthly_sales.csv");
  fs.writeFileSync(out, lines.join("\n"), "utf8");
  console.log("Wrote", lines.length - 1, "rows to", out);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});