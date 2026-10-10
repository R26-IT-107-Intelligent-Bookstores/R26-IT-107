const fs = require("fs");
const path = require("path");

// demand thresholds: calibrated from the score distribution (see calibrateLabels.js)
let THRESHOLDS = { high: 80, moderate: 50 };
try {
  THRESHOLDS = JSON.parse(
    fs.readFileSync(path.join(__dirname, "thresholds.json"), "utf8")
  );
} catch (e) {
  // no calibration file yet: keep the defaults
}

// helper - prediction label
const getPredictionLabel = (trendScore) => {
  if (trendScore >= THRESHOLDS.high) return "High Demand";
  if (trendScore >= THRESHOLDS.moderate) return "Moderate Demand";
  return "Low Demand";
};

// helper - calculate branch demand score
const calculateBranchDemandScore = ({
  dailySales,
  viewCount,
  searchCount,
  rating,
}) => {
  return (
    dailySales * 2 +
    viewCount * 0.03 +
    searchCount * 0.2 +
    rating * 10
  );
};

// helper - calculate final trend score
const calculateTrendScore = ({
  dailySales,
  viewCount,
  searchCount,
  rating,
  branchDemandScore,
  currentStock,
  categoryScore,
}) => {
  return (
    dailySales * 0.4 +
    viewCount * 0.02 +
    searchCount * 0.1 +
    rating * 10 +
    branchDemandScore * 0.2 +
    categoryScore * 0.1 -
    currentStock * 0.1
  );
};

// helper - category baseline score
const getCategoryScore = (category = "") => {
  const categoryText = category.toLowerCase();

  if (
    categoryText.includes("fantasy") ||
    categoryText.includes("යොවුන්") ||
    categoryText.includes("sci-fi") ||
    categoryText.includes("science fiction") ||
    categoryText.includes("විද්‍යා ප්‍රබන්ධ")
  ) {
    return 85;
  }

  if (
    categoryText.includes("thriller") ||
    categoryText.includes("crime") ||
    categoryText.includes("mystery") ||
    categoryText.includes("detective") ||
    categoryText.includes("රහස්") ||
    categoryText.includes("ත්‍රාසජනක")
  ) {
    return 80;
  }

  if (
    categoryText.includes("novel") ||
    categoryText.includes("fiction") ||
    categoryText.includes("නවකතා")
  ) {
    return 70;
  }

  if (
    categoryText.includes("business") ||
    categoryText.includes("ව්‍යාපාර")
  ) {
    return 75;
  }

  if (
    categoryText.includes("education") ||
    categoryText.includes("educational") ||
    categoryText.includes("අධ්‍යාපන")
  ) {
    return 65;
  }

  if (
    categoryText.includes("children") ||
    categoryText.includes("ළමා")
  ) {
    return 60;
  }

  if (
    categoryText.includes("history") ||
    categoryText.includes("ඉතිහාස")
  ) {
    return 60;
  }

  if (
    categoryText.includes("buddhist") ||
    categoryText.includes("buddhism") ||
    categoryText.includes("බෞද්ධ")
  ) {
    return 55;
  }

  return 50;
};

module.exports = {
  getPredictionLabel,
  calculateBranchDemandScore,
  calculateTrendScore,
  getCategoryScore,
};