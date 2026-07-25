"use client";
import navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBranchSummary } from "../../lib/api";

export default function TrendStockPage() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getBranchSummary();
      setBranches(result.data || []);
    } catch (error) {
      console.error("Error loading branch summary:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const goToBranch = (branchId) => {
    router.push(`/trendstock/branch/${branchId}`);
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>TrendStock Intelligence Dashboard</h1>
          <p style={styles.subtitle}>
            Branch-wise demand prediction, sales trends, and smart restock decisions.
          </p>
        </div>

        <button onClick={loadData} style={styles.button}>
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </section>

      <section>
        <h2 style={styles.sectionHeading}>Select a Branch</h2>
        <p style={styles.sectionNote}>
          Click a branch to see its top trending books, demand predictions, and restock recommendations.
        </p>

        {branches.length > 0 ? (
          <div style={styles.branchGrid}>
            {branches.map((branch) => (
              <div
                key={branch.branchId}
                style={styles.branchCard}
                onClick={() => goToBranch(branch.branchId)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-4px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div style={styles.branchCardHeader}>
                  <span style={styles.branchIcon}>🏬</span>
                  <h3 style={styles.branchName}>{branch.name}</h3>
                </div>

                <div style={styles.branchStatsGrid}>
                  <div style={styles.branchStatBox}>
                    <span style={styles.branchStatLabel}>Total Sold</span>
                    <strong style={styles.branchStatValue}>
                      {branch.totalSold}
                    </strong>
                  </div>

                  <div style={styles.branchStatBox}>
                    <span style={styles.branchStatLabel}>High Demand</span>
                    <strong style={styles.branchStatValue}>
                      {branch.highDemandCount}
                    </strong>
                  </div>
                </div>

                {branch.topBook ? (
                  <div style={styles.topBookBox}>
                    <span style={styles.mlLabel}>Top Trending Book</span>
                    <p style={styles.topBookTitle}>{branch.topBook.title}</p>
                    <div style={styles.topBookMeta}>
                      <span style={getPredictionStyle(branch.topBook.prediction)}>
                        {branch.topBook.prediction}
                      </span>
                      <span style={styles.trendScoreBadge}>
                        Score: {Number(branch.topBook.trendScore).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={styles.empty}>No trend data yet.</p>
                )}

                <div style={styles.viewMoreRow}>
                  <span style={styles.viewMoreText}>
                    View {branch.bookCount} books →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.empty}>
            {loading ? "Loading branches..." : "No branch data available yet."}
          </p>
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
      padding: "4px 9px",
      borderRadius: "999px",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      display: "inline-block",
      fontSize: "12px",
    };
  }

  if (prediction === "Low Demand") {
    return {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "4px 9px",
      borderRadius: "999px",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      display: "inline-block",
      fontSize: "12px",
    };
  }

  return {
    backgroundColor: "#e5e7eb",
    color: "#374151",
    padding: "4px 9px",
    borderRadius: "999px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    display: "inline-block",
    fontSize: "12px",
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
    marginBottom: "32px",
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
  sectionHeading: { fontSize: "24px", margin: "0 0 6px 0" },
  sectionNote: { color: "#64748b", fontSize: "14px", marginBottom: "24px" },
  branchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  branchCard: {
    background: "white",
    padding: "26px",
    borderRadius: "18px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    border: "1px solid #e2e8f0",
  },
  branchCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },
  branchIcon: { fontSize: "28px" },
  branchName: { fontSize: "22px", margin: 0 },
  branchStatsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "18px",
  },
  branchStatBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
  },
  branchStatLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  branchStatValue: { fontSize: "20px" },
  topBookBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
  },
  mlLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "6px",
  },
  topBookTitle: {
    fontWeight: "700",
    fontSize: "15px",
    margin: "0 0 8px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  topBookMeta: { display: "flex", gap: "8px", alignItems: "center" },
  trendScoreBadge: {
    fontSize: "12px",
    color: "#1e40af",
    fontWeight: "600",
  },
  viewMoreRow: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "14px",
    textAlign: "right",
  },
  viewMoreText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "14px",
  },
  empty: {
    color: "#64748b",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "10px",
  },
};