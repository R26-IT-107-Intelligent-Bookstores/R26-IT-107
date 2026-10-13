const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const TrendSignal = require("../models/TrendSignal");

const DRY = process.argv.includes("--dry");
const HIGH_SHARE = 0.15; // top 15% of scores = High Demand
const LOW_SHARE = 0.4; // bottom 40% of scores = Low Demand

(async () => {
  await connectDB();

  const rows = await TrendSignal.find().select("trendScore").lean();
  const scores = rows
    .map((r) => Number(r.trendScore))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const q = (p) => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))];
  const high = Number(q(1 - HIGH_SHARE).toFixed(2));
  const moderate = Number(q(LOW_SHARE).toFixed(2));

  const nHigh = scores.filter((s) => s >= high).length;
  const nMod = scores.filter((s) => s >= moderate && s < high).length;
  const nLow = scores.filter((s) => s < moderate).length;

  console.log("Signals:", scores.length);
  console.log("Score range:", scores[0], "to", scores[scores.length - 1]);
  console.log("New thresholds:  High >=", high, "| Moderate >=", moderate);
  console.log("Resulting labels: High", nHigh, "| Moderate", nMod, "| Low", nLow);

  if (DRY) {
    console.log("\nDRY RUN: nothing was written.");
    await mongoose.connection.close();
    return;
  }

  fs.writeFileSync(
    path.join(__dirname, "thresholds.json"),
    JSON.stringify({ high, moderate }, null, 2)
  );

  await TrendSignal.updateMany({ trendScore: { $gte: high } }, { prediction: "High Demand" });
  await TrendSignal.updateMany(
    { trendScore: { $gte: moderate, $lt: high } },
    { prediction: "Moderate Demand" }
  );
  await TrendSignal.updateMany({ trendScore: { $lt: moderate } }, { prediction: "Low Demand" });

  console.log("thresholds.json written and all labels updated.");
  await mongoose.connection.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});