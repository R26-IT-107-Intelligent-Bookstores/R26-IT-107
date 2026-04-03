const express = require("express");
const router = express.Router();
const Sales = require("../models/Sales");

// GET - branch trend summary
router.get("/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;

    const sales = await Sales.find({ branch: branchId }).populate("book");

    const trendMap = {};

    sales.forEach((sale) => {
      const bookId = sale.book._id.toString();

      if (!trendMap[bookId]) {
        trendMap[bookId] = {
          bookId: sale.book._id,
          title: sale.book.title,
          author: sale.book.author,
          totalSold: 0,
          recentSold: 0
        };
      }

      trendMap[bookId].totalSold += sale.quantitySold;

      const saleDate = new Date(sale.saleDate);
      const now = new Date();
      const diffDays = (now - saleDate) / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) {
        trendMap[bookId].recentSold += sale.quantitySold;
      }
    });

    const trends = Object.values(trendMap).map((item) => {
      const trendScore = item.recentSold * 2 + item.totalSold;

      return {
        ...item,
        trendScore,
        isTrending: trendScore >= 10
      };
    });

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;