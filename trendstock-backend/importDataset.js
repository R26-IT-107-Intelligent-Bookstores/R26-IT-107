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

const csvFilePath = path.join(__dirname, "books_dataset.csv");

const cleanNumber = (value) => {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
};

const cleanBoolean = (value) => {
  return String(value).toLowerCase() === "true";
};

const importData = async () => {
  try {
    await connectDB();

    const rows = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        console.log(`CSV rows found: ${rows.length}`);

        for (const row of rows) {
          const book = await Book.create({
            bookId: row["Book ID"],
            title: row["Title"],
            author: row["Author"],
            category: row["Category"],
            price: cleanNumber(row["Price (Rs.)"]),
            isbn: row["ISBN"],
            coverImageUrl: row["Cover Image URL"],
            inStock: cleanBoolean(row["In Stock"]),
            viewCount: cleanNumber(row["View Count"]),
            rating: cleanNumber(row["Rating"]),
            searchTags: row["Search Tags"],
            searchCount: cleanNumber(row["Search Count"]),
          });

          let branch = await Branch.findOne({ name: row["Branch"] });

          if (!branch) {
            branch = await Branch.create({
              name: row["Branch"],
            });
          }

          const inventory = await Inventory.create({
            book: book._id,
            branch: branch._id,
            quantity: cleanNumber(row["Current Stock"]),
          });

          await Sales.create({
            book: book._id,
            branch: branch._id,
            quantitySold: cleanNumber(row["Daily Sales"]),
            saleDate: new Date(),
          });

          await TrendSignal.create({
            book: book._id,
            branch: branch._id,
            trendScore: cleanNumber(row["Trend Score"]),
            prediction: row["Trend Label"],
          });
        }

        console.log("Dataset imported successfully!");
        mongoose.connection.close();
      });
  } catch (error) {
    console.error("Import failed:", error.message);
    mongoose.connection.close();
  }
};

importData();