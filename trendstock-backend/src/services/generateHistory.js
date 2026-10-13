const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Book = require("../models/Book");
const Branch = require("../models/Branch");
const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");
const { getCategoryScore } = require("./trendCalculator");
const { recomputeTrend } = require("./recomputeTrend");

const DRY = process.argv.includes("--dry");
const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2025, 0, 1);
const DAYS = 364; // same year as the first 100 books
const DAILY_LAST = 35; // last 35 days are daily records (keeps the 30-day average accurate)

// popularity multiplier for the whole branch
const BRANCH = { Colombo: 1.3, Kandy: 1.0, Galle: 0.75 };
// Jan..Dec: New Year (Apr), Colombo Book Fair (Sep), holidays (Dec)
const SEASON = [1.0, 0.95, 1.0, 1.15, 0.95, 0.9, 0.95, 1.0, 1.25, 1.05, 1.0, 1.2];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
function rngFrom(seed) {
  let a = Math.floor(seed * 4294967295) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

(async () => {
  await connectDB();

  const branches = await Branch.find();
  const books = await Book.find();
  const withSales = new Set((await Sales.distinct("book")).map(String));
  const targets = books.filter((b) => !withSales.has(String(b._id)));

  console.log("Books in TrendStock:       ", books.length);
  console.log("Books with sales already:  ", withSales.size);
  console.log("Books needing history:     ", targets.length);

  // build all sales records in memory first
  const records = [];
  const dailyFrom = START + (DAYS - DAILY_LAST) * DAY;

  for (const b of targets) {
    const rating = Number(b.rating) || 0;
    const ratingPart = rating > 0 ? rating / 5 : 0.5; // unrated books get a neutral value
    const z =
      0.5 * ratingPart +
      0.3 * (getCategoryScore(b.category) / 100) +
      0.2 * hash(String(b.isbn));
    const base = 2.9 * (0.4 + 1.6 * z); // units per day for an average branch

    for (const br of branches) {
      const rng = rngFrom(hash(String(b.isbn) + br.name));
      const branchF = BRANCH[br.name] || 1;
      let t = START;
      const end = START + DAYS * DAY;
      while (t < end) {
        const len = t < dailyFrom ? Math.min(7, Math.round((dailyFrom - t) / DAY)) : 1;
        const month = new Date(t).getUTCMonth();
        const mean = base * branchF * SEASON[month] * len;
        const qty = Math.round(Math.max(0, mean * (1 + (0.35 / Math.sqrt(len)) * gauss(rng))));
        if (qty > 0) {
          records.push({
            book: b._id,
            branch: br._id,
            quantitySold: qty,
            saleDate: new Date(t + Math.floor(len / 2) * DAY + 12 * 3600 * 1000),
          });
        }
        t += len * DAY;
      }
    }
  }

  const units = records.reduce((s, r) => s + r.quantitySold, 0);
  const perDay = targets.length ? units / (targets.length * branches.length * DAYS) : 0;
  console.log("Sales records to create:   ", records.length);
  console.log("Average units/day/book/branch:", perDay.toFixed(2));

  if (DRY) {
    console.log("\nDRY RUN: nothing was written.");
    await mongoose.connection.close();
    return;
  }

  for (let i = 0; i < records.length; i += 5000) {
    await Sales.insertMany(records.slice(i, i + 5000), { ordered: false });
    console.log("  inserted", Math.min(i + 5000, records.length), "/", records.length);
  }

  // recompute the trend score for every new book at every branch
  const pairs = [];
  for (const b of targets) for (const br of branches) pairs.push([b._id, br._id]);
  let done = 0;
  for (let i = 0; i < pairs.length; i += 10) {
    await Promise.all(pairs.slice(i, i + 10).map(([bk, brn]) => recomputeTrend(bk, brn)));
    done += Math.min(10, pairs.length - i);
    if (done % 300 === 0 || done === pairs.length) console.log("  trend scores:", done, "/", pairs.length);
  }

  await mongoose.connection.close();
  console.log("Done.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});