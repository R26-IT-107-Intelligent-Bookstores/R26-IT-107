const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Book = require("../models/Book");
const Branch = require("../models/Branch");
const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");
const { getCategoryScore } = require("./trendCalculator");
const { recomputeTrend } = require("./recomputeTrend");

const DRY = process.argv.includes("--dry");
const FILE = path.join(__dirname, "fedbooks.txt");
const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2025, 0, 1);
const DAYS = 364;
const DAILY_LAST = 35;
const BRANCH = { Colombo: 1.3, Kandy: 1.0, Galle: 0.75 };
const SEASON = [1.0, 0.95, 1.0, 1.15, 0.95, 0.9, 0.95, 1.0, 1.25, 1.05, 1.0, 1.2];
const MAX_MENTIONS = 325;

const digits = (s) => String(s || "").replace(/[^0-9Xx]/g, "").toUpperCase();

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

// parse lines like:  Title — Author [ISBN: 978...] (youtube=60, bluesky=24)
function parse(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(.*) \[ISBN: ([0-9Xx-]+)\] \((.*)\)$/);
    if (!m) continue;
    const head = m[1];
    const i = head.lastIndexOf(" — ");
    const title = i >= 0 ? head.slice(0, i) : head;
    const author = i >= 0 ? head.slice(i + 3) : "Unknown";
    let mentions = 0;
    for (const p of m[3].split(",")) mentions += Number(p.split("=")[1]) || 0;
    out.push({ title: title.trim(), author: author.trim(), isbn: m[2], mentions });
  }
  return out;
}

(async () => {
  await connectDB();

  const rows = parse(fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, ""));
  const existing = new Set((await Book.find().select("isbn")).map((b) => digits(b.isbn)));

  const seen = new Set();
  const fresh = [];
  let dupes = 0;
  let already = 0;
  for (const r of rows) {
    const d = digits(r.isbn);
    if (d.length < 10 || seen.has(d)) { dupes++; continue; }
    seen.add(d);
    if (existing.has(d)) { already++; continue; }
    fresh.push(r);
  }

  const branches = await Branch.find();
  console.log("Lines parsed:           ", rows.length);
  console.log("Skipped (dup/bad ISBN): ", dupes);
  console.log("Already in TrendStock:  ", already);
  console.log("NEW books to add:       ", fresh.length);

  // build books + sales history (popularity comes from REAL mention counts)
  const bookDocs = fresh.map((r) => ({
    bookId: "FED-" + digits(r.isbn),
    title: r.title,
    author: r.author,
    category: "International (English)",
    price: 0,
    isbn: r.isbn,
    coverImageUrl: "",
    inStock: true,
    viewCount: 0,
    searchCount: 0,
    rating: 0,
    searchTags: `${r.title}, ${r.author}`,
  }));

  const dailyFrom = START + (DAYS - DAILY_LAST) * DAY;
  const plan = fresh.map((r) => {
    const mentionNorm = Math.log1p(r.mentions) / Math.log1p(MAX_MENTIONS);
    const z = 0.5 * Math.min(1, mentionNorm) + 0.3 * (getCategoryScore("International (English)") / 100) + 0.2 * hash(r.isbn);
    return { isbn: r.isbn, base: 2.9 * (0.4 + 1.6 * z) };
  });

  // estimate record count for the dry run
  const perPair = Math.ceil((DAYS - DAILY_LAST) / 7) + DAILY_LAST;
  console.log("Branches:               ", branches.map((b) => b.name).join(", "));
  console.log("Sales records (approx): ", fresh.length * branches.length * perPair);

  if (DRY) {
    console.log("\nDRY RUN: nothing was written.");
    await mongoose.connection.close();
    return;
  }

  const inserted = await Book.insertMany(bookDocs, { ordered: false });
  console.log("Books added:            ", inserted.length);

  const inv = [];
  const records = [];
  inserted.forEach((b, idx) => {
    const base = plan[idx].base;
    for (const br of branches) {
      inv.push({
        book: b._id,
        branch: br._id,
        quantity: 20 + Math.floor(hash(String(b.isbn) + br.name) * 100),
      });
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
  });

  await Inventory.insertMany(inv, { ordered: false });
  console.log("Inventory rows added:   ", inv.length);

  for (let i = 0; i < records.length; i += 5000) {
    await Sales.insertMany(records.slice(i, i + 5000), { ordered: false });
    if ((i / 5000) % 10 === 0) console.log("  sales inserted", Math.min(i + 5000, records.length), "/", records.length);
  }
  const units = records.reduce((s, r) => s + r.quantitySold, 0);
  console.log("Sales records added:    ", records.length);
  console.log("Avg units/day/book/branch:", (units / (inserted.length * branches.length * DAYS)).toFixed(2));

  const pairs = [];
  for (const b of inserted) for (const br of branches) pairs.push([b._id, br._id]);
  let done = 0;
  for (let i = 0; i < pairs.length; i += 10) {
    await Promise.all(pairs.slice(i, i + 10).map(([bk, brn]) => recomputeTrend(bk, brn)));
    done += Math.min(10, pairs.length - i);
    if (done % 600 === 0 || done === pairs.length) console.log("  trend scores:", done, "/", pairs.length);
  }

  await mongoose.connection.close();
  console.log("Done.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});