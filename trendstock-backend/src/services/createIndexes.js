const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");
const TrendSignal = require("../models/TrendSignal");
const Book = require("../models/Book");

(async () => {
  await connectDB();
  const t0 = Date.now();

  // Sales: covered indexes (the aggregations read only the index, not the documents)
  await Sales.collection.createIndex({ branch: 1, saleDate: 1, quantitySold: 1 });
  await Sales.collection.createIndex({ branch: 1, book: 1, quantitySold: 1 });
  await Sales.collection.createIndex({ book: 1, branch: 1, saleDate: -1 });

  await Inventory.collection.createIndex({ book: 1, branch: 1 });
  await Inventory.collection.createIndex({ branch: 1 });

  await TrendSignal.collection.createIndex({ branch: 1, trendScore: -1 });
  await TrendSignal.collection.createIndex({ book: 1, branch: 1 });

  await Book.collection.createIndex({ isbn: 1 });

  console.log("Indexes ready in", ((Date.now() - t0) / 1000).toFixed(1), "seconds");
  for (const m of [Sales, Inventory, TrendSignal, Book]) {
    const idx = await m.collection.indexes();
    console.log(m.modelName + ":", idx.map((i) => i.name).join(", "));
  }
  await mongoose.connection.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});