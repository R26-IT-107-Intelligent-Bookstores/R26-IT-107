const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");

const Book = require("./src/models/Book");
const Branch = require("./src/models/Branch");
const Inventory = require("./src/models/Inventory");
const Sales = require("./src/models/Sales");
const TrendSignal = require("./src/models/TrendSignal");

const BOOKS_CSV = path.join(__dirname, "books_master.csv");
const DAILY_CSV = path.join(__dirname, "daily_sales_dataset.csv");
const MONTHLY_CSV = path.join(__dirname, "monthly_trend_dataset.csv");

const BRANCH_NAMES = ["Colombo", "Kandy", "Galle"];
const BATCH_SIZE = 5000;

const cleanNumber = (value) => {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
};

const readCsv = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });

const importData = async () => {
  try {
    await connectDB();

    // ---- 1. Clear old data ----
    console.log("Clearing old collections...");
    await Book.deleteMany({});
    await Inventory.deleteMany({});
    await Sales.deleteMany({});
    await TrendSignal.deleteMany({});
    await Branch.deleteMany({});
    console.log("Old data cleared.\n");

    // ---- 2. Create branches ----
    console.log("Creating branches...");
    const branchMap = {}; // Branch_Name -> ObjectId
    for (const name of BRANCH_NAMES) {
        const branch = await Branch.create({ name, city: name });
        branchMap[name] = branch._id;
      }
    console.log("Branches created:", BRANCH_NAMES.join(", "), "\n");

    // ---- 3. Load CSVs ----
    console.log("Reading CSV files...");
    const bookRows = await readCsv(BOOKS_CSV);
    const monthlyRows = await readCsv(MONTHLY_CSV);
    console.log(`books_master.csv: ${bookRows.length} rows`);
    console.log(`monthly_trend_dataset.csv: ${monthlyRows.length} rows\n`);

    // book-level averages (rating/view/search) across branch+month, since
    // the Book schema stores one site-wide value, not per-branch values
    const bookAgg = {}; // Book_ID -> { ratingSum, viewSum, searchSum, count }
    for (const row of monthlyRows) {
      const id = row["Book_ID"];
      if (!bookAgg[id]) bookAgg[id] = { ratingSum: 0, viewSum: 0, searchSum: 0, count: 0 };
      bookAgg[id].ratingSum += cleanNumber(row["Rating"]);
      bookAgg[id].viewSum += cleanNumber(row["View_Count"]);
      bookAgg[id].searchSum += cleanNumber(row["Search_Count"]);
      bookAgg[id].count += 1;
    }

    // ---- 4. Create books ----
    console.log("Creating books...");
    const bookMap = {}; // Book_ID (csv) -> Mongo ObjectId
    for (const row of bookRows) {
      const id = row["Book_ID"];
      const agg = bookAgg[id] || { ratingSum: 0, viewSum: 0, searchSum: 0, count: 1 };

      const book = await Book.create({
        bookId: id,
        title: row["Book_Name"],
        author: row["Author"],
        category: row["Category"],
        price: Math.round(500 + Math.random() * 1500), // placeholder LKR price
        isbn: row["ISBN"],
        coverImageUrl: "",
        inStock: true,
        viewCount: Math.round(agg.viewSum / agg.count),
        rating: Number((agg.ratingSum / agg.count).toFixed(1)),
        searchTags: row["Category"],
        searchCount: Math.round(agg.searchSum / agg.count),
      });
      bookMap[id] = book._id;
    }
    console.log(`${Object.keys(bookMap).length} books created.\n`);

    // ---- 5. Import daily sales (batched insertMany -- 55k+ rows) ----
    console.log("Reading daily_sales_dataset.csv (this file is large, please wait)...");
    let salesBatch = [];
    let totalSalesInserted = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(DAILY_CSV)
        .pipe(csv())
        .on("data", (row) => {
          const bookObjId = bookMap[row["Book_ID"]];
          const branchObjId = branchMap[row["Branch_Name"]];
          if (!bookObjId || !branchObjId) return;

          salesBatch.push({
            book: bookObjId,
            branch: branchObjId,
            quantitySold: cleanNumber(row["Daily_Sales"]),
            saleDate: new Date(row["Date"]),
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Inserting ${salesBatch.length} sales records in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < salesBatch.length; i += BATCH_SIZE) {
      const chunk = salesBatch.slice(i, i + BATCH_SIZE);
      await Sales.insertMany(chunk, { ordered: false });
      totalSalesInserted += chunk.length;
      console.log(`  ...${totalSalesInserted}/${salesBatch.length} inserted`);
    }
    console.log("All daily sales imported.\n");

    // ---- 6. Import Inventory + TrendSignal (latest month snapshot) ----
    const latestMonth = monthlyRows.reduce(
      (max, r) => (r["Month"] > max ? r["Month"] : max),
      monthlyRows[0]["Month"]
    );
    console.log(`Using latest month for Inventory/TrendSignal snapshot: ${latestMonth}`);

    const latestRows = monthlyRows.filter((r) => r["Month"] === latestMonth);
    let invCount = 0;
    let trendCount = 0;

    for (const row of latestRows) {
      const bookObjId = bookMap[row["Book_ID"]];
      const branchObjId = branchMap[row["Branch_Name"]];
      if (!bookObjId || !branchObjId) continue;

      await Inventory.create({
        book: bookObjId,
        branch: branchObjId,
        quantity: cleanNumber(row["Current_Stock"]),
      });
      invCount++;

      await TrendSignal.create({
        book: bookObjId,
        branch: branchObjId,
        trendScore: cleanNumber(row["Trend_Score"]),
        prediction: row["Trend_Label"],
        branchDemandScore: cleanNumber(row["Branch_Demand_Score"]),
        categoryScore: cleanNumber(row["CategoryScore"]),
      });
      trendCount++;
    }

    console.log(`${invCount} inventory records created.`);
    console.log(`${trendCount} trend signal records created.\n`);

    console.log("=== Import complete ===");
    console.log(`Books: ${Object.keys(bookMap).length}`);
    console.log(`Branches: ${BRANCH_NAMES.length}`);
    console.log(`Sales: ${totalSalesInserted}`);
    console.log(`Inventory: ${invCount}`);
    console.log(`TrendSignals: ${trendCount}`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Import failed:", error.message);
    mongoose.connection.close();
  }
};

importData();