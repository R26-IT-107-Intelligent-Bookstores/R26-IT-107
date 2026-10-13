const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Inventory = require("../models/Inventory");
const { recomputeTrend } = require("./recomputeTrend");

(async () => {
  await connectDB();
  const rows = await Inventory.find().select("book branch").lean();
  console.log("Recomputing", rows.length, "trend scores...");

  let done = 0;
  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);
    await Promise.all(batch.map((r) => recomputeTrend(r.book, r.branch)));
    done += batch.length;
    if (done % 600 === 0 || done === rows.length) console.log("  ", done, "/", rows.length);
  }

  await mongoose.connection.close();
  console.log("Done.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});