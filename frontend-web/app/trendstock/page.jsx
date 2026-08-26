"use client";
import navbar from "../../components/Navbar";
import { getBranchSummary, getBranchesCount, getLowStockCount, getTopTrendingBooks } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrendStockPage() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role !== "admin") {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getBranchSummary();
      
      setBranches(result?.data || result || []); 
    } catch (error) {
      console.error("Error loading branch summary:", error);
    }
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_TRENDSTOCK_API_URL || "http://localhost:5000"}/api/dashboard`
      );
      if (!response.ok) {
        console.warn(
          `TrendStock dashboard responded with ${response.status}; using fallback data.`
        );
        setDashboardData({
          totalBranches: 0,
          totalBooks: 0,
          totalUnitsSold: 0,
        });
        return;
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.warn(
        "Unable to fetch TrendStock dashboard data; using fallback data.",
        error
      );
      setDashboardData({
        totalBranches: 0,
        totalBooks: 0,
        totalUnitsSold: 0,
      });
    }
    setDashboardLoading(false);
  };

  useEffect(() => {
    if (authorized) {
      loadData();
      fetchDashboardData();
    }
  }, [authorized]);

  const goToBranch = (branchId) => {
    router.push(`/trendstock/branch/${branchId}`);
  };

  if (!authorized) {
    return null;
  }

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

      <section style={styles.dashboardSection}>
        <h2 style={styles.sectionHeading}>Overview</h2>
        <p style={styles.sectionNote}>
          Live snapshot across all branches.
        </p>

        {dashboardLoading ? (
          <p style={styles.loading}>Loading overview...</p>
        ) : dashboardData ? (
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Branches</span>
              <strong style={styles.statValue}>
                {dashboardData.totalBranches}
              </strong>
            </div>

            <div style={styles.statCard}>
              <span style={styles.statLabel}>Books Tracked</span>
              <strong style={styles.statValue}>
                {dashboardData.totalBooks}
              </strong>
            </div>

            <div style={styles.statCardOk}>
              <span style={styles.statLabel}>Total Units Sold</span>
              <strong style={styles.statValueOk}>
                {dashboardData.totalUnitsSold?.toLocaleString()}
              </strong>
            </div>
          </div>
        ) : (
          <p style={styles.empty}>Unable to reach TrendStock backend route.</p>
        )}
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
                key={branch.branchId || branch._id}
                style={styles.branchCard}
                onClick={() => goToBranch(branch.branchId || branch._id)}
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
    backgroundColor: "#fef3c7",
    color: "#92400e",
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
    marginBottom: "32px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  title: { fontSize: "32px", marginBottom: "8px", fontWeight: "800" },
  subtitle: { fontSize: "16px", opacity: 0.9 },
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
  dashboardSection: {
    marginBottom: "40px",
  },
  sectionHeading: { fontSize: "24px", margin: "0 0 6px 0", color: "#042f2e", fontWeight: "800" },
  sectionNote: { color: "#475569", fontSize: "14px", marginBottom: "24px" },
  loading: { color: "#475569", fontSize: "14px" },

  // ---- Overview stat cards ----
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  statCard: {
    background: "white",
    border: "1px solid #f1f5f9",
    borderRadius: "16px",
    padding: "22px 24px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  },
  statCardOk: {
    background: "white",
    border: "1px solid #a7f3d0",
    borderRadius: "16px",
    padding: "22px 24px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  },
  statCardAlert: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: "16px",
    padding: "22px 24px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  },
  statLabel: {
    display: "block",
    fontSize: "13px",
    color: "#475569",
    marginBottom: "8px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  statValue: {
    fontSize: "34px",
    color: "#042f2e",
  },
  statValueOk: {
    fontSize: "34px",
    color: "#047857",
  },
  statValueAlert: {
    fontSize: "34px",
    color: "#be123c",
  },

  branchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  branchCard: {
    background: "white",
    padding: "26px",
    borderRadius: "18px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    border: "1px solid #f1f5f9",
  },
  branchCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },
  branchIcon: { fontSize: "28px" },
  branchName: { fontSize: "22px", margin: 0, color: "#042f2e" },
  branchStatsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "18px",
  },
  branchStatBox: {
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
  },
  branchStatLabel: {
    display: "block",
    fontSize: "12px",
    color: "#475569",
    marginBottom: "4px",
  },
  branchStatValue: { fontSize: "20px", color: "#042f2e" },
  topBookBox: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
  },
  mlLabel: {
    display: "block",
    fontSize: "12px",
    color: "#475569",
    marginBottom: "6px",
  },
  topBookTitle: {
    fontWeight: "700",
    fontSize: "15px",
    margin: "0 0 8px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#042f2e",
  },
  topBookMeta: { display: "flex", gap: "8px", alignItems: "center" },
  trendScoreBadge: {
    fontSize: "12px",
    color: "#047857",
    fontWeight: "600",
  },
  viewMoreRow: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "14px",
    textAlign: "right",
  },
  viewMoreText: {
    color: "#047857",
    fontWeight: "700",
    fontSize: "14px",
  },
  empty: {
    color: "#475569",
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "10px",
  },
};