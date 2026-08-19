"use client";
import navbar from "../../../../components/Navbar";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  getBranchById,
  getBranchTrendDetail,
  getRestockRecommendations,
  getBranchMonthlySales,
} from "../../../../lib/api";

const DEMAND_COLORS = {
  "High Demand": "#16a34a",
  "Moderate Demand": "#f59e0b",
  "Low Demand": "#dc2626",
};

const CATEGORY_COLORS = [
  "#047857", "#7c3aed", "#0891b2", "#ea580c",
  "#16a34a", "#db2777", "#0d9488", "#65a30d",
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "books", label: "Trending Books" },
  { id: "restock", label: "Restock Recommendations" },
];

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.branchId;

  const [branch, setBranch] = useState(null);
  const [detail, setDetail] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predictionFilter, setPredictionFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = async () => {
    setLoading(true);
    try {
      const branchResult = await getBranchById(branchId);
      setBranch(branchResult);

      const detailResult = await getBranchTrendDetail(branchId);
      const detailData = detailResult.data || null;
      setDetail(detailData);

      const restockResult = await getRestockRecommendations();
      const restockData = Array.isArray(restockResult)
        ? restockResult
        : restockResult.data || [];

      const branchName = branchResult?.name;
      setRecommendations(
        restockData.filter((item) => item.branchName === branchName)
      );

      // fetch 12-month sales history across ALL books at this branch (sales trend chart)
      const monthlyResult = await getBranchMonthlySales(branchId);
      setMonthlySales(monthlyResult.data || []);
    } catch (error) {
      console.error("Error loading branch detail:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (branchId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const books = detail?.books || [];
  const topBook = books[0];

  const filteredRecommendations = recommendations.filter((item) => {
    return predictionFilter === "All" || item.prediction === predictionFilter;
  });

  const uniquePredictions = [
    "All",
    ...new Set(recommendations.map((item) => item.prediction).filter(Boolean)),
  ];

  // --- chart data prep ---
  const barChartData = books.slice(0, 10).map((b) => ({
    name: b.title.length > 16 ? b.title.slice(0, 16) + "…" : b.title,
    fullName: b.title,
    trendScore: Number(b.trendScore.toFixed(1)),
    prediction: b.prediction,
  }));

  const categoryCounts = {};
  books
    .filter((b) => b.prediction === "High Demand")
    .forEach((b) => {
      const cat = b.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  const donutData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const lineChartData = monthlySales.map((m) => ({
    month: m.month?.slice(5), // "2025-08" -> "08"
    sold: m.totalSold,
  }));

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <button onClick={() => router.push("/trendstock")} style={styles.backButton}>
            ← All Branches
          </button>
          <h1 style={styles.title}>
            {branch?.name || "Branch"} — Demand Overview
          </h1>
          <p style={styles.subtitle}>
            Top trending books, demand predictions, and restock recommendations for this branch.
          </p>
        </div>

        <button onClick={loadData} style={styles.button}>
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </section>

      {/* --- TAB BAR --- */}
      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={activeTab === tab.id ? styles.tabActive : styles.tab}
          >
            {tab.label}
            {tab.id === "restock" && recommendations.length > 0 && (
              <span
                style={
                  activeTab === tab.id
                    ? styles.tabBadgeActive
                    : styles.tabBadge
                }
              >
                {recommendations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* --- OVERVIEW TAB: summary cards + ML card + charts --- */}
      {activeTab === "overview" && (
        <>
          <section style={styles.summaryGrid}>
            <div style={styles.summaryBox}>
              <span style={styles.mlLabel}>Total Books Tracked</span>
              <strong style={styles.summaryValue}>{detail?.totalBooks ?? "-"}</strong>
            </div>
            <div style={styles.summaryBox}>
              <span style={styles.mlLabel}>High Demand Books</span>
              <strong style={{ ...styles.summaryValue, color: "#16a34a" }}>
                {detail?.highDemandCount ?? "-"}
              </strong>
            </div>
            <div style={styles.summaryBox}>
              <span style={styles.mlLabel}>Top Trend Score</span>
              <strong style={styles.summaryValue}>
                {topBook ? Number(topBook.trendScore).toFixed(1) : "-"}
              </strong>
            </div>
          </section>

          {/* --- REDESIGNED: ML Demand Overview --- */}
          <section style={styles.card}>
            <h2 style={styles.cardTitleNoMargin}>ML Demand Overview</h2>
            <p style={styles.sectionNote}>
              Highest trend score book currently at this branch.
            </p>

            {topBook ? (
              <>
                <div style={styles.mlSpotlight}>
                  <div style={styles.mlSpotlightLeft}>
                    <div style={getIconCircleStyle(topBook.prediction)}>
                      {topBook.prediction === "High Demand"
                        ? "📈"
                        : topBook.prediction === "Low Demand"
                        ? "📉"
                        : "📊"}
                    </div>
                    <div>
                      <span style={getPredictionStyle(topBook.prediction)}>
                        {topBook.prediction}
                      </span>
                      <h3 style={styles.mlBookTitle}>{topBook.title}</h3>
                      <span style={styles.mlCategoryTag}>
                        {topBook.category || "Uncategorized"}
                      </span>
                    </div>
                  </div>

                  <div style={styles.mlSpotlightRight}>
                    <TrendScoreRing score={topBook.trendScore} />
                  </div>
                </div>

                <div style={styles.mlDetailChips}>
                  <div style={styles.mlChip}>
                    <span style={styles.mlChipIcon}>📦</span>
                    <div>
                      <span style={styles.mlLabel}>Current Stock</span>
                      <strong style={styles.mlChipValue}>
                        {topBook.currentStock} units
                      </strong>
                    </div>
                  </div>

                  <div style={styles.mlChip}>
                    <span style={styles.mlChipIcon}>🎯</span>
                    <div>
                      <span style={styles.mlLabel}>Trend Score</span>
                      <strong style={styles.mlChipValue}>
                        {Number(topBook.trendScore).toFixed(2)} / 110
                      </strong>
                    </div>
                  </div>

                  <div style={styles.mlChip}>
                    <span style={styles.mlChipIcon}>🏷️</span>
                    <div>
                      <span style={styles.mlLabel}>Category</span>
                      <strong style={styles.mlChipValue}>
                        {topBook.category || "-"}
                      </strong>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p style={styles.empty}>No trend data available for this branch yet.</p>
            )}
          </section>

          <section style={styles.chartGrid}>
            <div style={styles.card}>
              <h2 style={styles.cardTitleNoMargin}>Top 10 Books by Trend Score</h2>
              <p style={styles.sectionNote}>Color indicates demand level.</p>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" domain={[0, "dataMax + 10"]} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [value, "Trend Score"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullName || label
                      }
                    />
                    <Bar dataKey="trendScore" radius={[0, 8, 8, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={index} fill={DEMAND_COLORS[entry.prediction] || "#047857"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.empty}>No data to chart yet.</p>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitleNoMargin}>High-Demand Books by Category</h2>
              <p style={styles.sectionNote}>Category mix of currently trending books.</p>
              {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={false}
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.empty}>No high-demand books yet.</p>
              )}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitleNoMargin}>
              Total Sales Trend — {branch?.name}
            </h2>
            <p style={styles.sectionNote}>
              Total units sold across all books at this branch, by month.
            </p>
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineChartData} margin={{ left: 10, right: 20, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sold"
                    stroke="#047857"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#047857" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={styles.empty}>No monthly sales history available.</p>
            )}
          </section>
        </>
      )}

      {/* --- TRENDING BOOKS TAB --- */}
      {activeTab === "books" && (
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitleNoMargin}>Top Trending Books — {branch?.name}</h2>
            <span style={styles.smallHint}>Sorted by trend score</span>
          </div>

          {books.length > 0 ? (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: "24%" }}>Book</th>
                    <th style={{ ...styles.th, width: "13%" }}>Category</th>
                    <th style={{ ...styles.th, width: "13%" }}>Trend Score</th>
                    <th style={{ ...styles.th, width: "16%" }}>Prediction</th>
                    <th style={{ ...styles.th, width: "17%" }}>Current Stock</th>
                    <th style={{ ...styles.th, width: "17%" }}>Total Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <tr
                      key={index}
                      style={index % 2 === 0 ? styles.trEven : styles.trOdd}
                    >
                      <td style={styles.bookTd}>{book.title}</td>
                      <td style={styles.td}>{book.category || "-"}</td>
                      <td style={styles.td}>
                        <TrendScoreBar score={book.trendScore} />
                      </td>
                      <td style={styles.td}>
                        <span style={getPredictionStyle(book.prediction)}>
                          {book.prediction}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <StockBar stock={book.currentStock} />
                      </td>
                      <td style={styles.td}>{book.totalSold.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={styles.empty}>No books found for this branch.</p>
          )}
        </section>
      )}

      {/* --- RESTOCK RECOMMENDATIONS TAB --- */}
      {activeTab === "restock" && (
        <section style={styles.card}>
          <div style={styles.restockHeader}>
            <div>
              <h2 style={styles.cardTitleNoMargin}>Smart Restock Recommendations</h2>
              <p style={styles.sectionNote}>
                Current Stock = available quantity. Restock Quantity = suggested reorder amount.
              </p>
            </div>

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
                    <th style={{ ...styles.th, width: "26%" }}>Book</th>
                    <th style={{ ...styles.th, width: "10%" }}>Current Stock</th>
                    <th style={{ ...styles.th, width: "15%" }}>Prediction</th>
                    <th style={{ ...styles.th, width: "10%" }}>Trend Score</th>
                    <th style={{ ...styles.th, width: "16%" }}>Action</th>
                    <th style={{ ...styles.th, width: "11%" }}>Restock Qty</th>
                    <th style={{ ...styles.th, width: "12%" }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecommendations.map((item, index) => (
                    <tr
                      key={index}
                      style={index % 2 === 0 ? styles.trEven : styles.trOdd}
                    >
                      <td style={styles.bookTd}>{item.bookTitle || "-"}</td>
                      <td style={styles.td}>
                        <strong>{item.currentQuantity}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={getPredictionStyle(item.prediction)}>
                          {item.prediction}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <strong>
                          {item.trendScore ? Number(item.trendScore).toFixed(2) : "-"}
                        </strong>
                      </td>
                      <td style={styles.td}>
                        <span style={getActionStyle(item.recommendedAction)}>
                          {item.recommendedAction}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            item.recommendedQuantity > 0
                              ? styles.restockQtyBadge
                              : styles.zeroQtyBadge
                          }
                        >
                          {item.recommendedQuantity}
                        </span>
                      </td>
                      <td style={styles.reasonTd}>
                        {item.reason || "Based on stock, sales, and demand indicators"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={styles.empty}>No restock recommendations for this branch.</p>
          )}
        </section>
      )}
    </main>
  );
}

// --- small visual components ---

function TrendScoreBar({ score }) {
  const pct = Math.min(100, (score / 110) * 100);
  const color = score >= 71 ? "#16a34a" : score >= 63 ? "#f59e0b" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ ...styles.barTrack, width: "70px" }}>
        <div style={{ ...styles.barFill, width: `${pct}%`, background: color }} />
      </div>
      <strong style={{ fontSize: "13px", color }}>{score.toFixed(1)}</strong>
    </div>
  );
}

function StockBar({ stock }) {
  const pct = Math.min(100, (stock / 150) * 100);
  const color = stock < 20 ? "#dc2626" : stock < 50 ? "#f59e0b" : "#16a34a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ ...styles.barTrack, width: "60px" }}>
        <div style={{ ...styles.barFill, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: "13px" }}>{stock}</span>
    </div>
  );
}

// NEW: circular progress ring for the ML Demand Overview spotlight
function TrendScoreRing({ score }) {
  const max = 110;
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = score >= 71 ? "#16a34a" : score >= 63 ? "#f59e0b" : "#dc2626";

  return (
    <div style={{ position: "relative", width: "130px", height: "130px" }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={radius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
        <circle
          cx="65"
          cy="65"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <strong style={{ fontSize: "26px", color }}>{score.toFixed(1)}</strong>
        <span style={{ fontSize: "11px", color: "#64748b" }}>Trend Score</span>
      </div>
    </div>
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
      display: "inline-block",
      fontSize: "13px",
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
      display: "inline-block",
      fontSize: "13px",
    };
  }

  return {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    display: "inline-block",
    fontSize: "13px",
  };
};

const getActionStyle = (action) => {
  if (action === "Urgent Restock") {
    return {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "6px 10px",
      borderRadius: "8px",
      fontWeight: "700",
      display: "inline-block",
      fontSize: "13px",
      whiteSpace: "nowrap",
    };
  }

  if (action === "Increase Safety Stock") {
    return {
      backgroundColor: "#d1fae5",
      color: "#065f46",
      padding: "6px 10px",
      borderRadius: "8px",
      fontWeight: "700",
      display: "inline-block",
      fontSize: "13px",
      whiteSpace: "nowrap",
    };
  }

  if (action === "Restock") {
    return {
      backgroundColor: "#fef3c7",
      color: "#92400e",
      padding: "6px 10px",
      borderRadius: "8px",
      fontWeight: "700",
      display: "inline-block",
      fontSize: "13px",
      whiteSpace: "nowrap",
    };
  }

  return {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "6px 10px",
    borderRadius: "8px",
    fontWeight: "700",
    display: "inline-block",
    fontSize: "13px",
    whiteSpace: "nowrap",
  };
};

// NEW: colored icon circle behind the emoji, matching demand color
const getIconCircleStyle = (prediction) => {
  const bg =
    prediction === "High Demand"
      ? "#dcfce7"
      : prediction === "Low Demand"
      ? "#fee2e2"
      : "#fef3c7";
  return {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    flexShrink: 0,
  };
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 5%",
    background: "#ffffff",
    fontFamily: '"Inter", "Arial", sans-serif',
    color: "#042f2e",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #042f2e, #047857)",
    color: "white",
    padding: "30px",
    borderRadius: "18px",
    marginBottom: "24px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  backButton: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "none",
    padding: "6px 14px",
    borderRadius: "50px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "12px",
  },
  title: { fontSize: "30px", marginBottom: "8px", fontWeight: "800" },
  subtitle: { fontSize: "15px", opacity: 0.9 },
  button: {
    background: "white",
    color: "#047857",
    border: "none",
    padding: "12px 24px",
    borderRadius: "50px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(4, 120, 87, 0.2)",
  },

  // ---- Tab bar ----
  tabBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "0px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    transition: "color 0.15s ease, border-color 0.15s ease",
  },
  tabActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "none",
    borderBottom: "3px solid #047857",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#047857",
    cursor: "pointer",
  },
  tabBadge: {
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "999px",
  },
  tabBadgeActive: {
    background: "#d1fae5",
    color: "#047857",
    fontSize: "12px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "999px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryBox: {
    background: "white",
    borderRadius: "14px",
    padding: "18px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
    textAlign: "center",
  },
  summaryValue: { fontSize: "26px", color: "#042f2e" },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
    marginBottom: "24px",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  cardTitleNoMargin: { fontSize: "22px", margin: 0, color: "#042f2e", fontWeight: "800" },
  smallHint: {
    fontSize: "12px",
    color: "#475569",
    background: "#f8fafc",
    padding: "5px 8px",
    borderRadius: "999px",
  },

  // ---- ML Demand Overview: redesigned spotlight layout ----
  mlSpotlight: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
    padding: "24px",
    background: "linear-gradient(135deg, #f8fafc, #ecfdf5)",
    border: "1px solid #f1f5f9",
    borderRadius: "16px",
    marginTop: "18px",
  },
  mlSpotlightLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },
  mlSpotlightRight: {
    flexShrink: 0,
  },
  mlBookTitle: {
    fontSize: "22px",
    margin: "8px 0 6px 0",
    color: "#042f2e",
  },
  mlCategoryTag: {
    display: "inline-block",
    background: "#d1fae5",
    color: "#065f46",
    fontSize: "12px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  mlDetailChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "18px",
  },
  mlChip: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: "12px",
    padding: "14px 18px",
    flex: "1 1 200px",
  },
  mlChipIcon: {
    fontSize: "22px",
  },
  mlChipValue: {
    fontSize: "16px",
    display: "block",
    marginTop: "2px",
    color: "#042f2e",
  },

  predictionBox: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "28px 0",
  },
  predictionNumber: {
    fontSize: "46px",
    fontWeight: "bold",
    color: "#047857",
  },
  mlSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    margin: "16px 0",
  },
  mlSummaryBox: {
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: "12px",
    padding: "12px",
  },
  mlLabel: {
    display: "block",
    fontSize: "12px",
    color: "#475569",
    marginBottom: "4px",
  },
  sectionNote: {
    margin: "6px 0 14px 0",
    color: "#475569",
    fontSize: "13px",
  },
  empty: {
    color: "#475569",
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "10px",
  },
  restockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "18px",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "white",
    fontSize: "14px",
    minWidth: "170px",
    color: "#042f2e",
  },
  tableWrapper: {
    overflowX: "auto",
    maxHeight: "560px",
    overflowY: "auto",
    border: "1px solid #f1f5f9",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "fixed",
    minWidth: "900px",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    background: "#ecfdf5",
    padding: "12px 10px",
    textAlign: "left",
    borderBottom: "1px solid #a7f3d0",
    whiteSpace: "nowrap",
    fontSize: "13px",
    color: "#042f2e",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    fontSize: "14px",
  },
  trEven: { background: "white" },
  trOdd: { background: "#f8fafc" },
  bookTd: {
    padding: "10px",
    borderBottom: "1px solid #f1f5f9",
    fontWeight: "600",
    lineHeight: 1.4,
    wordBreak: "break-word",
    color: "#042f2e",
  },
  reasonTd: {
    padding: "10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  restockQtyBadge: {
    display: "inline-block",
    background: "#d1fae5",
    color: "#065f46",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "800",
    minWidth: "34px",
    textAlign: "center",
  },
  zeroQtyBadge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#475569",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "800",
    minWidth: "34px",
    textAlign: "center",
  },
  barTrack: {
    height: "8px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },
};