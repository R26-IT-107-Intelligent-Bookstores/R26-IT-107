// trendstock-backend/src/services/resetStock.js
// Sets realistic stock levels from recent demand, so top sellers are not at 0.
// Usage:  node src/services/resetStock.js --dry     (preview only)
//         node src/services/resetStock.js           (write to database)
require("dotenv").config();
const mongoose = require("mongoose");
const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");

const DRY = process.argv.includes("--dry");

// small repeatable random generator (same result every run)
let seed = 12345;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
  if (!uri) { console.error("No Mongo URI found in .env"); process.exit(1); }
  await mongoose.connect(uri);

  // each book-branch is measured over the 30 days ending at ITS OWN latest sale
  const DAY = 24 * 60 * 60 * 1000;
  const latest = await Sales.aggregate([
    { $group: { _id: { book: "$book", branch: "$branch" }, last: { $max: "$saleDate" } } },
  ]).allowDiskUse(true);
  const lastDate = new Map(latest.map((r) => [`${r._id.book}_${r._id.branch}`, new Date(r.last).getTime()]));

  const units30 = new Map();
  const cursor = Sales.aggregate([
    {
      $group: {
        _id: {
          book: "$book",
          branch: "$branch",
          day: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
        },
        units: { $sum: "$quantitySold" },
      },
    },
  ]).allowDiskUse(true).cursor();
  for await (const r of cursor) {
    const key = `${r._id.book}_${r._id.branch}`;
    const end = lastDate.get(key);
    const t = new Date(r._id.day + "T00:00:00Z").getTime();
    if (end !== undefined && t > end - 30 * DAY - DAY) {
      units30.set(key, (units30.get(key) || 0) + r.units);
    }
  }

  const inv = await Inventory.find({}, "book branch quantity").lean();
  const zeroBefore = inv.filter((i) => i.quantity === 0).length;

  const ops = [];
  let zeroAfter = 0, total = 0;
  for (const i of inv) {
    const daily = (units30.get(`${i.book}_${i.branch}`) || 0) / 30;
    let qty;
    if (rand() < 0.08) qty = randInt(0, 3);              // ~8% running low (shows restock needs)
    else qty = Math.round(daily * randInt(10, 45)) + randInt(0, 4); // 10-45 days of cover
    if (qty === 0) zeroAfter++;
    total += qty;
    ops.push({ updateOne: { filter: { _id: i._id }, update: { $set: { quantity: qty } } } });
  }

  console.log("Inventory records:", inv.length);
  console.log("Out of stock before:", zeroBefore, "| after:", zeroAfter);
  console.log("Average stock after:", (total / inv.length).toFixed(1));
  if (DRY) { console.log("DRY RUN - nothing written"); }
  else { await Inventory.bulkWrite(ops); console.log("Stock updated. Now run recomputeAll.js"); }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });