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
      setRecommendations(Array.isArray(restockResult) ? restockResult : restockResult.data || []);
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
    ...new Set(recommendations.map((item) => item.branchName)),
  ];
  
  const uniquePredictions = [
    "All",
    ...new Set(recommendations.map((item) => item.prediction)),
  ];

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
          <h2 style={styles.cardTitle}>ML Trend Prediction</h2>

          {prediction ? (
            <>
            <div style={styles.predictionBox}>
            <span style={styles.predictionNumber}>
                {prediction.status === "Trending" ? "📈" : "📉"}
             </span>
            <span
                style={{
                ...styles.badge,
                backgroundColor:
                  prediction.status === "Trending" ? "#dcfce7" : "#fee2e2",
                color:
                 prediction.status === "Trending" ? "#166534" : "#991b1b",
              }}
  >
                 {prediction.status}
             </span>
            </div>
              
              <p style={styles.description}>
                The trained ML model predicts whether the selected book trend is rising.
              </p>
            </>
          ) : (
            <p style={styles.empty}>No prediction available.</p>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Top Trending Books</h2>

          {topBooks.length > 0 ? (
            <ul style={styles.list}>
              {topBooks.map((book, index) => (
                <li key={index} style={styles.listItem}>
                  <span>
                    <strong>{book.title}</strong>
                    <br />
                    <small>{book.author}</small>
                  </span>
                  <span style={styles.sold}>Sold: {book.totalSold}</span>
                </li>
              ))}
            </ul>
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
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Qty</th>
                </tr>
              </thead>
              <tbody>
              {filteredRecommendations.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{item.bookTitle}</td>
                    <td style={styles.td}>{item.branchName}</td>
                    <td style={styles.td}>{item.currentQuantity}</td>
                    <td style={styles.td}>
                    <span style={getPredictionStyle(item.prediction)}>
                    {item.prediction}
                     </span>
                    </td>
                    <td style={styles.td}>{item.recommendedAction}</td>
                    <td style={styles.td}>{item.recommendedQuantity}</td>
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
      };
    }
  
    if (prediction === "Low Demand") {
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        padding: "6px 10px",
        borderRadius: "999px",
        fontWeight: "bold",
      };
    }
  
    return {
      backgroundColor: "#e5e7eb",
      color: "#374151",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: "bold",
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
  title: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    opacity: 0.9,
  },
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
  cardTitle: {
    fontSize: "22px",
    marginBottom: "18px",
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
  description: {
    color: "#475569",
  },
  empty: {
    color: "#64748b",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "10px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  sold: {
    fontWeight: "bold",
    color: "#2563eb",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#eff6ff",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #bfdbfe",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
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