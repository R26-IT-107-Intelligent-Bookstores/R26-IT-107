"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getBranches,
  getBranchTrendDetail,
  getSales,
  addSale,
  deleteSale,
} from "../../lib/api";

const DEMAND_COLORS = {
  "High Demand": { bg: "#dcfce7", fg: "#166534" },
  "Moderate Demand": { bg: "#fef3c7", fg: "#92400e" },
  "Low Demand": { bg: "#fee2e2", fg: "#991b1b" },
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const unitText = (n) => `${n} ${Number(n) === 1 ? "unit" : "units"}`;

export default function SalesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [branchBooks, setBranchBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const [search, setSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saleDate, setSaleDate] = useState(todayISO());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [impact, setImpact] = useState(null);

  const [sales, setSales] = useState([]);

  // admin only, same as the other TrendStock pages
  useEffect(() => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (role !== "admin") router.push("/login");
    else setAuthorized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSales = async () => {
    const res = await getSales();
    setSales(Array.isArray(res) ? res : res.data || []);
  };

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      const res = await getBranches();
      const list = Array.isArray(res) ? res : res.data || [];
      setBranches(list);
      if (list.length) setBranchId(list[0]._id);
      loadSales();
    })();
  }, [authorized]);

  // books stocked at the selected branch, with stock + trend score
  const loadBranchBooks = async (id) => {
    if (!id) return;
    setLoadingBooks(true);
    const res = await getBranchTrendDetail(id);
    setBranchBooks(res?.data?.books || []);
    setLoadingBooks(false);
  };

  useEffect(() => {
    setBookId("");
    setSearch("");
    loadBranchBooks(branchId);
  }, [branchId]);

  const branchName = branches.find((b) => b._id === branchId)?.name || "";
  const selectedBook = branchBooks.find((b) => String(b.bookId) === String(bookId));

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? branchBooks.filter((b) => (b.title || "").toLowerCase().includes(q))
      : branchBooks;
    return list.slice(0, 200);
  }, [branchBooks, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const qty = Number(quantity);
    if (!selectedBook) return setError("Choose a book first.");
    if (!Number.isInteger(qty) || qty < 1) return setError("Quantity must be a whole number of 1 or more.");
    if (qty > selectedBook.currentStock)
      return setError(`Only ${unitText(selectedBook.currentStock)} in stock at ${branchName}.`);

    setSaving(true);
    const before = { ...selectedBook };
    const result = await addSale({
      book: selectedBook.bookId,
      branch: branchId,
      quantitySold: qty,
      saleDate,
    });
    setSaving(false);

    if (!result || result.success === false || result.error) {
      setError(result?.error || "The sale could not be recorded. Please try again.");
      return;
    }

    setImpact({
      title: before.title,
      branchName,
      branchId,
      quantity: qty,
      saleId: result.data?._id,
      stockBefore: before.currentStock,
      stockAfter: result.updatedInventory?.quantity ?? before.currentStock - qty,
      scoreBefore: Number(before.trendScore),
      scoreAfter: Number(result.trendSignal?.trendScore ?? before.trendScore),
      labelBefore: before.prediction,
      labelAfter: result.trendSignal?.prediction || before.prediction,
    });

    setQuantity(1);
    await Promise.all([loadBranchBooks(branchId), loadSales()]);
  };

  const handleUndo = async (saleId, title) => {
    if (!window.confirm(`Delete this sale of "${title}"? The stock will be put back and the trend score recalculated.`)) return;
    const result = await deleteSale(saleId);
    if (result?.success === false || result?.error) {
      setError(result.error || "The sale could not be deleted.");
      return;
    }
    if (impact?.saleId === saleId) setImpact(null);
    await Promise.all([loadBranchBooks(branchId), loadSales()]);
  };

  if (!authorized) return null;

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <h1 style={styles.title}>Record a Sale</h1>
          <p style={styles.subtitle}>
            Each sale reduces branch stock and recalculates the book&apos;s trend score and demand level.
          </p>
        </div>
      </section>

      <div style={styles.grid}>
        {/* ---- form ---- */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>New sale</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Branch
              <select style={styles.input} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Find a book
              <input
                style={styles.input}
                placeholder={loadingBooks ? "Loading books..." : `Search ${branchBooks.length} books at ${branchName}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label style={styles.label}>
              Book
              <select style={styles.input} value={bookId} onChange={(e) => setBookId(e.target.value)} required>
                <option value="">Select a book</option>
                {filteredBooks.map((b) => (
                  <option key={b.bookId} value={b.bookId}>
                    {b.title} — {unitText(b.currentStock)} in stock
                  </option>
                ))}
              </select>
              {branchBooks.length > 200 && !search && (
                <span style={styles.hint}>Showing the 200 top-trending books. Type above to find others.</span>
              )}
            </label>

            {selectedBook && (
              <div style={styles.nowBox}>
                <div><span style={styles.miniLabel}>In stock</span><strong>{unitText(selectedBook.currentStock)}</strong></div>
                <div><span style={styles.miniLabel}>Trend score</span><strong>{Number(selectedBook.trendScore).toFixed(1)} / 100</strong></div>
                <div><span style={styles.miniLabel}>Demand</span><DemandPill label={selectedBook.prediction} /></div>
              </div>
            )}

            <div style={styles.row}>
              <label style={{ ...styles.label, flex: 1 }}>
                Quantity sold
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  step="1"
                  max={selectedBook?.currentStock || undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </label>
              <label style={{ ...styles.label, flex: 1 }}>
                Sale date
                <input style={styles.input} type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
              </label>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button style={saving ? styles.buttonDisabled : styles.button} disabled={saving}>
              {saving ? "Recording..." : "Record sale"}
            </button>
          </form>
        </section>

        {/* ---- impact ---- */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Sale impact</h2>
          {impact ? (
            <>
              <p style={styles.impactHead}>
                Sold <strong>{unitText(impact.quantity)}</strong> of <strong>{impact.title}</strong> at {impact.branchName}
              </p>

              <ImpactRow
                label="Stock"
                before={unitText(impact.stockBefore)}
                after={unitText(impact.stockAfter)}
                delta={impact.stockAfter - impact.stockBefore}
                suffix=" units"
              />
              <ImpactRow
                label="Trend score"
                before={impact.scoreBefore.toFixed(1)}
                after={impact.scoreAfter.toFixed(1)}
                delta={Number((impact.scoreAfter - impact.scoreBefore).toFixed(1))}
              />
              <div style={styles.impactRow}>
                <span style={styles.impactLabel}>Demand level</span>
                <span style={styles.impactValues}>
                  <DemandPill label={impact.labelBefore} />
                  <span style={styles.arrow}>→</span>
                  <DemandPill label={impact.labelAfter} />
                </span>
                <span style={styles.deltaNeutral}>
                  {impact.labelBefore === impact.labelAfter ? "unchanged" : "changed"}
                </span>
              </div>

              <div style={styles.impactActions}>
                <Link href={`/trendstock/branch/${impact.branchId}`} style={styles.linkButton}>
                  View {impact.branchName} dashboard →
                </Link>
                {impact.saleId && (
                  <button type="button" style={styles.undoButton} onClick={() => handleUndo(impact.saleId, impact.title)}>
                    Undo this sale
                  </button>
                )}
              </div>
            </>
          ) : (
            <p style={styles.empty}>
              Record a sale to see how it changes the book&apos;s stock, trend score and demand level.
              The branch dashboard shows the same updated values.
            </p>
          )}
        </section>
      </div>

      {/* ---- recent sales ---- */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitleNoMargin}>Recent sales</h2>
          <span style={styles.smallHint}>Latest 100, newest first</span>
        </div>
        {sales.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Book</th>
                  <th style={styles.th}>Branch</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Sale date</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, i) => (
                  <tr key={sale._id} style={i % 2 ? styles.trOdd : styles.trEven}>
                    <td style={styles.bookTd}>{sale.book?.title || "-"}</td>
                    <td style={styles.td}>{sale.branch?.name || "-"}</td>
                    <td style={styles.td}>{sale.quantitySold}</td>
                    <td style={styles.td}>{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : "-"}</td>
                    <td style={styles.td}>
                      <button type="button" style={styles.deleteButton} onClick={() => handleUndo(sale._id, sale.book?.title || "this book")}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.empty}>No sales recorded yet.</p>
        )}
      </section>
    </main>
  );
}

function DemandPill({ label }) {
  const c = DEMAND_COLORS[label] || DEMAND_COLORS["Moderate Demand"];
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "4px 10px", borderRadius: "999px", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap" }}>
      {label || "-"}
    </span>
  );
}

function ImpactRow({ label, before, after, delta, suffix = "" }) {
  const color = delta > 0 ? "#166534" : delta < 0 ? "#991b1b" : "#475569";
  const sign = delta > 0 ? "+" : "";
  return (
    <div style={styles.impactRow}>
      <span style={styles.impactLabel}>{label}</span>
      <span style={styles.impactValues}>
        <span>{before}</span>
        <span style={styles.arrow}>→</span>
        <strong>{after}</strong>
      </span>
      <span style={{ ...styles.delta, color }}>
        {delta === 0 ? "no change" : `${sign}${delta}${suffix}`}
      </span>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: "40px 5%", background: "#ffffff", fontFamily: '"Inter", "Arial", sans-serif', color: "#042f2e" },
  hero: {
    background: "linear-gradient(135deg, #042f2e, #047857)", color: "white", padding: "30px", borderRadius: "18px",
    marginBottom: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
  },
  title: { fontSize: "30px", margin: "0 0 8px", fontWeight: "800" },
  subtitle: { fontSize: "15px", opacity: 0.9, margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", marginBottom: "24px", alignItems: "start" },
  card: {
    background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #f1f5f9",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)", marginBottom: "24px",
  },
  cardTitle: { fontSize: "20px", margin: "0 0 16px", fontWeight: "800" },
  cardTitleNoMargin: { fontSize: "20px", margin: 0, fontWeight: "800" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px", flexWrap: "wrap" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  row: { display: "flex", gap: "12px", flexWrap: "wrap" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" },
  input: { padding: "11px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", color: "#042f2e", background: "white" },
  hint: { fontSize: "12px", color: "#64748b", fontWeight: 400 },
  nowBox: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", background: "#f8fafc", border: "1px solid #f1f5f9",
    borderRadius: "12px", padding: "12px 14px", fontSize: "14px",
  },
  miniLabel: { display: "block", fontSize: "11px", color: "#64748b", marginBottom: "4px" },
  error: { margin: 0, color: "#991b1b", background: "#fee2e2", padding: "10px 12px", borderRadius: "8px", fontSize: "14px" },
  button: { padding: "13px 18px", background: "#047857", color: "white", border: "none", borderRadius: "999px", fontWeight: "700", fontSize: "15px", cursor: "pointer" },
  buttonDisabled: { padding: "13px 18px", background: "#94a3b8", color: "white", border: "none", borderRadius: "999px", fontWeight: "700", fontSize: "15px", cursor: "wait" },
  impactHead: { margin: "0 0 14px", color: "#334155" },
  impactRow: {
    display: "grid", gridTemplateColumns: "110px 1fr auto", alignItems: "center", gap: "12px",
    padding: "12px 14px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #f1f5f9", marginBottom: "10px",
  },
  impactLabel: { fontSize: "13px", color: "#475569", fontWeight: "600" },
  impactValues: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "15px" },
  arrow: { color: "#94a3b8" },
  delta: { fontWeight: "800", fontSize: "14px", whiteSpace: "nowrap" },
  deltaNeutral: { fontWeight: "700", fontSize: "13px", color: "#475569" },
  impactActions: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" },
  linkButton: { background: "#047857", color: "white", padding: "10px 18px", borderRadius: "999px", fontWeight: "700", textDecoration: "none", fontSize: "14px" },
  undoButton: { background: "white", color: "#991b1b", border: "1px solid #fecaca", padding: "10px 18px", borderRadius: "999px", fontWeight: "700", cursor: "pointer", fontSize: "14px" },
  empty: { color: "#475569", background: "#f8fafc", padding: "14px", borderRadius: "10px", margin: 0 },
  smallHint: { fontSize: "12px", color: "#475569", background: "#f8fafc", padding: "5px 8px", borderRadius: "999px" },
  tableWrapper: { overflowX: "auto", maxHeight: "460px", overflowY: "auto", border: "1px solid #f1f5f9", borderRadius: "14px" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "640px" },
  th: { position: "sticky", top: 0, background: "#ecfdf5", padding: "12px 10px", textAlign: "left", borderBottom: "1px solid #a7f3d0", fontSize: "13px" },
  td: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" },
  bookTd: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontWeight: "600", wordBreak: "break-word" },
  trEven: { background: "white" },
  trOdd: { background: "#f8fafc" },
  deleteButton: { background: "white", color: "#991b1b", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
};
