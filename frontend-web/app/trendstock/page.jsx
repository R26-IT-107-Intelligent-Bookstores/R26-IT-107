"use client";

import { useEffect, useState } from "react";
import {
  getMLPrediction,
  getTopTrendingBooks,
  getRestockRecommendations,
} from "../../lib/api";

export default function TrendStockPage() {
  const [prediction, setPrediction] = useState(null);
  const [topBooks, setTopBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("All");
  const [predictionFilter, setPredictionFilter] = useState("All");

  const loadData = async () => {
    setLoading(true);

    try {
      const mlResult = await getMLPrediction();
      const topResult = await getTopTrendingBooks();
      const restockResult = await getRestockRecommendations();

      setPrediction(mlResult);
      setTopBooks(topResult.data || []);
      setRecommendations(
        Array.isArray(restockResult) ? restockResult : restockResult.data || []
      );
    } catch (error) {
      console.error("Error loading data:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecommendations = recommendations.filter((item) => {
    const branchMatch =
      branchFilter === "All" || item.branchName === branchFilter;

    const predictionMatch =
      predictionFilter === "All" || item.prediction === predictionFilter;

    return branchMatch && predictionMatch;
  });

  const uniqueBranches = [
    "All",
    ...new Set(recommendations.map((item) => item.branchName).filter(Boolean)),
  ];

  const uniquePredictions = [
    "All",
    ...new Set(recommendations.map((item) => item.prediction).filter(Boolean)),
  ];

  const topPrediction = recommendations
    .filter((item) => item.trendScore)
    .sort((a, b) => b.trendScore - a.trendScore)[0];

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>TrendStock Intelligence Dashboard</h1>
          <p style={styles.subtitle}>
            ML-based book trend prediction and smart inventory recommendations.
          </p>
        </div>

        <button onClick={loadData} style={styles.button}>
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitleNoMargin}>ML Demand Overview</h2>
          </div>

          {topPrediction ? (
            <>
              <div style={styles.predictionBox}>
                <span style={styles.predictionNumber}>
                  {topPrediction.prediction === "High Demand"
                    ? "📈"
                    : topPrediction.prediction === "Low Demand"
                    ? "📉"
                    : "📊"}
                </span>

                <span style={getPredictionStyle(topPrediction.prediction)}>
                  {topPrediction.prediction}
                </span>
              </div>

              <div style={styles.mlSummaryGrid}>
                <div style={styles.mlSummaryBox}>
                  <span style={styles.mlLabel}>Top Book</span>
                  <strong>{topPrediction.bookTitle || "-"}</strong>
                </div>

                <div style={styles.mlSummaryBox}>
                  <span style={styles.mlLabel}>Branch</span>
                  <strong>{topPrediction.branchName || "-"}</strong>
                </div>

                <div style={styles.mlSummaryBox}>
                  <span style={styles.mlLabel}>Trend Score</span>
                  <strong>{Number(topPrediction.trendScore).toFixed(2)}</strong>
                </div>

                <div style={styles.mlSummaryBox}>
                  <span style={styles.mlLabel}>Current Stock</span>
                  <strong>{topPrediction.currentQuantity}</strong>
                </div>
              </div>

              <p style={styles.description}>
                Prediction is generated using sales, stock level, rating, view
                count, search count, and branch demand indicators.
              </p>
            </>
          ) : (
            <p style={styles.empty}>No ML demand prediction available yet.</p>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitleNoMargin}>Top Trending Books</h2>
            <span style={styles.smallHint}>Branch-wise sales ranking</span>
          </div>

          {topBooks.length > 0 ? (
            <div style={styles.trendingGrid}>
              {topBooks.map((book, index) => (
                <div key={index} style={styles.trendingItem}>
                  <div style={styles.trendingLeft}>
                    <h3 style={styles.bookTitle}>{book.title}</h3>
                    <p style={styles.bookMeta}>
                      {book.author || "Unknown Author"}
                    </p>
                    <span style={styles.branchBadge}>
                      📍 {book.branchName || "No Branch"}
                    </span>
                  </div>

                  <div style={styles.soldBadge}>
                    {book.totalSold}
                    <span style={styles.soldText}>sold</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.empty}>No sales data available yet.</p>
          )}
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Smart Restock Recommendations</h2>

        <div style={styles.filterRow}>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={styles.select}
          >
            {uniqueBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <select
            value={predictionFilter}
            onChange={(e) => setPredictionFilter(e.target.value)}
            style={styles.select}
          >
            {uniquePredictions.map((prediction) => (
              <option key={prediction} value={prediction}>
                {prediction}
              </option>
            ))}
          </select>
        </div>

        {filteredRecommendations.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Book</th>
                  <th style={styles.th}>Branch</th>
                  <th style={styles.th}>Current Stock</th>
                  <th style={styles.th}>Prediction</th>
                  <th style={styles.th}>Trend Score</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Reason</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecommendations.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{item.bookTitle || "-"}</td>
                    <td style={styles.td}>{item.branchName || "-"}</td>
                    <td style={styles.td}>{item.currentQuantity}</td>
                    <td style={styles.td}>
                      <span style={getPredictionStyle(item.prediction)}>
                        {item.prediction}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {item.trendScore ? Number(item.trendScore).toFixed(2) : "-"}
                    </td>
                    <td style={styles.td}>{item.recommendedAction}</td>
                    <td style={styles.td}>{item.recommendedQuantity}</td>
                    <td style={styles.reasonTd}>
                      {item.reason ||
                        "Based on stock, sales, and demand indicators"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.empty}>No restock recommendations available.</p>
        )}
      </section>
    </main>
  );
}

const getPredictionStyle = (prediction) => {
  if (prediction === "High Demand") {
    return {
      backgroundColor: "#dcfce7",
      color: "#166534",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: "bold",
      whiteSpace: "nowrap",
    };
  }

  if (prediction === "Low Demand") {
    return {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: "bold",
      whiteSpace: "nowrap",
    };
  }

  return {
    backgroundColor: "#e5e7eb",
    color: "#374151",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    color: "white",
    padding: "30px",
    borderRadius: "18px",
    marginBottom: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  },
  title: { fontSize: "32px", marginBottom: "8px" },
  subtitle: { fontSize: "16px", opacity: 0.9 },
  button: {
    background: "white",
    color: "#1d4ed8",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  cardTitle: { fontSize: "22px", marginBottom: "18px" },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  cardTitleNoMargin: { fontSize: "22px", margin: 0 },
  smallHint: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "5px 8px",
    borderRadius: "999px",
  },
  predictionBox: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "14px",
  },
  predictionNumber: {
    fontSize: "46px",
    fontWeight: "bold",
    color: "#2563eb",
  },
  badge: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "bold",
  },
  mlSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    margin: "16px 0",
  },
  mlSummaryBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
  },
  mlLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  description: { color: "#475569", lineHeight: 1.6 },
  empty: {
    color: "#64748b",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "10px",
  },
  trendingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    maxHeight: "390px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  trendingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },
  trendingLeft: { minWidth: 0 },
  bookTitle: {
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 4px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "360px",
  },
  bookMeta: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 6px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "360px",
  },
  branchBadge: {
    display: "inline-block",
    fontSize: "12px",
    background: "#dbeafe",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "999px",
    fontWeight: "600",
  },
  soldBadge: {
    minWidth: "62px",
    textAlign: "center",
    background: "#2563eb",
    color: "white",
    padding: "8px 10px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "18px",
  },
  soldText: {
    display: "block",
    fontSize: "11px",
    fontWeight: "500",
  },
  tableWrapper: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
  },
  th: {
    background: "#eff6ff",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #bfdbfe",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top",
  },
  reasonTd: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top",
    color: "#475569",
    fontSize: "13px",
    maxWidth: "320px",
  },
  filterRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "white",
    fontSize: "14px",
  },
};