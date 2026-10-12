// trendstock-backend/src/services/branchSeasonality.js
// Gives each branch its own monthly sales pattern (the simulated 2025 sales
// used one shared pattern, so all three branch charts looked the same).
//
// Usage (run from the trendstock-backend folder):
//   node src/services/branchSeasonality.js --dry    preview only, writes nothing
//   node src/services/branchSeasonality.js          write to database + recompute trend scores
//
// Safe to run more than once: the first run saves each sale's original
// quantity in "originalQuantity", and every run starts from that value.
require("dotenv").config();
const mongoose = require("mongoose");
const Branch = require("../models/Branch");
const Sales = require("../models/Sales");
const TrendSignal = require("../models/TrendSignal");
const { recomputeTrend } = require("./recomputeTrend");

const DRY = process.argv.includes("--dry");

// Monthly multipliers, January to December. Each row averages about 1.0, so a
// branch's yearly total stays about the same; only the shape changes.
const FACTORS = {
  // Colombo: busy in exam and school-term months, quiet mid-year
  Colombo: [0.95, 0.92, 1.14, 1.16, 1.12, 0.92, 0.86, 0.88, 1.06, 1.08, 1.0, 1.02],
  // Kandy: steady growth through the year
  Kandy: [0.86, 0.88, 0.92, 0.95, 0.97, 1.0, 1.03, 1.06, 1.09, 1.12, 1.1, 1.02],
  // Galle: tourist season in Dec to Feb, quiet May to Aug
  Galle: [1.18, 1.15, 1.0, 0.95, 0.84, 0.82, 0.86, 0.92, 0.95, 0.98, 1.04, 1.12],
};

// Repeatable pseudo-random number from the sale's id (same result every run)
function unitRandom(idString) {
  let h = 2166136261;
  for (let i = 0; i < idString.length; i++) {
    h ^= idString.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// 2.3 becomes 2 or 3 (30% chance of 3) so small quantities keep the right average
function stochasticRound(value, idString) {
  const base = Math.floor(value);
  return unitRandom(idString) < value - base ? base + 1 : base;
}

async function main() {
  const uri =
    process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
  if (!uri) {
    console.error("No Mongo URI found in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);

  const branches = await Branch.find();
  const nameById = new Map(branches.map((b) => [String(b._id), b.name]));
  for (const b of branches) {
    if (!FACTORS[b.name]) console.warn(`No pattern for branch "${b.name}", it is left unchanged.`);
  }

  // only the 2025 history is reshaped; sales recorded later (tests, live sales) are untouched
  const filter = {
    saleDate: { $gte: new Date("2025-01-01T00:00:00Z"), $lt: new Date("2026-01-01T00:00:00Z") },
  };

  const before = {};
  const after = {};
  const add = (store, name, month, qty) => {
    if (!store[name]) store[name] = Array(12).fill(0);
    store[name][month] += qty;
  };

  const col = Sales.collection; // native collection, so the extra field is allowed
  const cursor = col.find(filter);
  let ops = [];
  let seen = 0;

  for await (const sale of cursor) {
    const name = nameById.get(String(sale.branch));
    const factors = FACTORS[name];
    if (!factors) continue;

    const original = typeof sale.originalQuantity === "number" ? sale.originalQuantity : sale.quantitySold;
    const month = new Date(sale.saleDate).getUTCMonth();
    const next = Math.max(0, stochasticRound(original * factors[month], String(sale._id)));

    add(before, name, month, original);
    add(after, name, month, next);
    seen++;

    if (!DRY) {
      ops.push({
        updateOne: {
          filter: { _id: sale._id },
          update: { $set: { quantitySold: next, originalQuantity: original } },
        },
      });
      if (ops.length >= 2000) {
        await col.bulkWrite(ops, { ordered: false });
        ops = [];
      }
    }
  }
  if (!DRY && ops.length) await col.bulkWrite(ops, { ordered: false });

  console.log(`\nSales rows processed: ${seen}`);
  for (const name of Object.keys(after)) {
    console.log(`\n${name}`);
    console.log("  before:", before[name].join(", "));
    console.log("  after: ", after[name].join(", "));
  }

  if (DRY) {
    console.log("\nDry run only. Nothing was written.");
  } else {
    // trend scores use recent sales, so recalculate every book-branch pair
    const pairs = await TrendSignal.find({}, { book: 1, branch: 1 }).lean();
    console.log(`\nRecalculating ${pairs.length} trend scores...`);
    let done = 0;
    const BATCH = 10;
    for (let i = 0; i < pairs.length; i += BATCH) {
      await Promise.all(pairs.slice(i, i + BATCH).map((p) => recomputeTrend(p.book, p.branch)));
      done += Math.min(BATCH, pairs.length - i);
      if (done % 500 === 0) console.log(`  ${done} / ${pairs.length}`);
    }
    console.log("Done.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});