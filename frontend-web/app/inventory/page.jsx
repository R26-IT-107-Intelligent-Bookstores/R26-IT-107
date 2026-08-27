"use client";
import navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import {
  getBooks,
  getBranches,
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
} from "../../lib/api";

export default function InventoryPage() {
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    book: "",
    branch: "",
    quantity: "",
  });

  const loadData = async () => {
    const booksResult = await getBooks();
    const branchesResult = await getBranches();
    const inventoryResult = await getInventory();

    setBooks(Array.isArray(booksResult) ? booksResult : booksResult.data || []);
    setBranches(Array.isArray(branchesResult) ? branchesResult : branchesResult.data || []);
    setInventory(Array.isArray(inventoryResult) ? inventoryResult : inventoryResult.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      book: form.book,
      branch: form.branch,
      quantity: Number(form.quantity),
    };

    if (editingId) {
      await updateInventory(editingId, payload);
    } else {
      await addInventory(payload);
    }

    setForm({
      book: "",
      branch: "",
      quantity: "",
    });

    setEditingId(null);
    loadData();
  };

  const handleEdit = (inventoryId, branchId, bookId, quantity) => {
    setEditingId(inventoryId);

    setForm({
      book: bookId || "",
      branch: branchId || "",
      quantity: quantity ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      book: "",
      branch: "",
      quantity: "",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this inventory record?");
    if (!confirmDelete) return;

    await deleteInventory(id);
    loadData();
  };

  // --- pivot the flat inventory list into: one row per book, one column per branch ---
  const bookRows = {};
  inventory.forEach((item) => {
    const bookId = item.book?._id;
    if (!bookId) return;

    if (!bookRows[bookId]) {
      bookRows[bookId] = {
        bookId,
        title: item.book?.title || "-",
        category: item.book?.category || "",
        branchStock: {},
      };
    }

    bookRows[bookId].branchStock[item.branch?._id] = {
      inventoryId: item._id,
      quantity: Math.round(item.quantity),
    };
  });

  const pivotRows = Object.values(bookRows).filter((row) =>
    row.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MAX_STOCK_FOR_BAR = 80; // visual scale reference for the mini bar

  const getStockLevel = (quantity) => {
    if (quantity === undefined) return "empty";
    if (quantity < 20) return "low";
    if (quantity < 50) return "mid";
    return "high";
  };

  const getStockBadgeStyle = (level) => {
    if (level === "low") return styles.stockBadgeLow;
    if (level === "mid") return styles.stockBadgeMid;
    if (level === "high") return styles.stockBadgeHigh;
    return styles.stockBadgeEmpty;
  };

  const getBarColor = (level) => {
    if (level === "low") return "#dc2626";
    if (level === "mid") return "#f59e0b";
    if (level === "high") return "#059669";
    return "#e2e8f0";
  };

  // branch totals for the footer summary row
  const branchTotals = {};
  branches.forEach((branch) => {
    branchTotals[branch._id] = pivotRows.reduce((sum, row) => {
      const cell = row.branchStock[branch._id];
      return sum + (cell ? cell.quantity : 0);
    }, 0);
  });

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Inventory Management</h1>
      <p style={styles.subtitle}>Link books to branches and manage stock quantity.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <select
          style={styles.input}
          value={form.book}
          onChange={(e) => setForm({ ...form, book: e.target.value })}
          required
        >
          <option value="">Select Book</option>
          {books.map((book) => (
            <option key={book._id} value={book._id}>
              {book.title}
            </option>
          ))}
        </select>

        <select
          style={styles.input}
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          required
        >
          <option value="">Select Branch</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="number"
          placeholder="Stock Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />

        <button style={styles.button}>
          {editingId ? "Update Inventory" : "Add Inventory"}
        </button>

        {editingId && (
          <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
            Cancel
          </button>
        )}
      </form>

      <section style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <div>
            <h2 style={styles.cardTitle}>Inventory List</h2>
            <p style={styles.cardSubtitle}>{pivotRows.length} books tracked across {branches.length} branches</p>
          </div>
          <input
            style={styles.searchInput}
            placeholder="Search by book title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* legend */}
        <div style={styles.legendRow}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#dc2626" }} /> Low (&lt;20)
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#f59e0b" }} /> Moderate (20–49)
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#059669" }} /> Healthy (50+)
          </span>
        </div>

        {pivotRows.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: "left", width: "30%" }}>Book</th>
                  {branches.map((branch) => (
                    <th key={branch._id} style={styles.th}>
                      🏬 {branch.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivotRows.map((row, rowIndex) => (
                  <tr
                    key={row.bookId}
                    style={rowIndex % 2 === 0 ? styles.trEven : styles.trOdd}
                  >
                    <td style={styles.bookTd}>
                      <div style={styles.bookTitle}>{row.title}</div>
                      {row.category && (
                        <span style={styles.categoryTag}>{row.category}</span>
                      )}
                    </td>
                    {branches.map((branch) => {
                      const cell = row.branchStock[branch._id];
                      const level = getStockLevel(cell?.quantity);
                      const barPct = cell
                        ? Math.min(100, (cell.quantity / MAX_STOCK_FOR_BAR) * 100)
                        : 0;

                      return (
                        <td key={branch._id} style={styles.stockTd}>
                          {cell ? (
                            <div style={styles.stockCell}>
                              <div style={styles.stockTopRow}>
                                <span style={getStockBadgeStyle(level)}>{cell.quantity}</span>
                                <div style={styles.cellActions}>
                                  <button
                                    onClick={() =>
                                      handleEdit(cell.inventoryId, branch._id, row.bookId, cell.quantity)
                                    }
                                    style={styles.iconEditButton}
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => handleDelete(cell.inventoryId)}
                                    style={styles.iconDeleteButton}
                                    title="Delete"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                              <div style={styles.barTrack}>
                                <div
                                  style={{
                                    ...styles.barFill,
                                    width: `${barPct}%`,
                                    background: getBarColor(level),
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span style={styles.stockBadgeEmpty}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={styles.footerRow}>
                  <td style={styles.footerTd}>Branch Total</td>
                  {branches.map((branch) => (
                    <td key={branch._id} style={styles.footerTdValue}>
                      {branchTotals[branch._id]?.toLocaleString() ?? 0}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p style={styles.empty}>No inventory records available.</p>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 5%",
    background: "#ffffff",
    fontFamily: '"Inter", "Arial", sans-serif',
    color: "#042f2e",
  },
  title: { fontSize: "32px", marginBottom: "8px", fontWeight: "800", color: "#042f2e" },
  subtitle: { color: "#475569", marginBottom: "24px" },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto auto",
    gap: "12px",
    marginBottom: "24px",
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  },
  input: {
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "white",
    color: "#042f2e",
  },
  button: {
    padding: "12px 24px",
    background: "#047857",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(4, 120, 87, 0.2)",
  },
  cancelButton: {
    padding: "12px 24px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontWeight: "600",
    cursor: "pointer",
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "12px",
  },
  cardTitle: { fontSize: "22px", margin: 0, fontWeight: "800", color: "#042f2e" },
  cardSubtitle: { fontSize: "13px", color: "#475569", margin: "4px 0 0 0" },
  searchInput: {
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "50px",
    fontSize: "14px",
    minWidth: "240px",
    color: "#042f2e",
  },
  legendRow: {
    display: "flex",
    gap: "18px",
    marginBottom: "16px",
    paddingBottom: "14px",
    borderBottom: "1px solid #f1f5f9",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#475569",
    fontWeight: "600",
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
  },
  tableWrapper: {
    overflowX: "auto",
    maxHeight: "640px",
    overflowY: "auto",
    border: "1px solid #f1f5f9",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "640px",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    background: "#ecfdf5",
    padding: "14px 12px",
    textAlign: "center",
    borderBottom: "1px solid #a7f3d0",
    color: "#042f2e",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  trEven: { background: "white" },
  trOdd: { background: "#f8fafc" },
  bookTd: {
    padding: "14px 12px",
    borderBottom: "1px solid #f1f5f9",
  },
  bookTitle: {
    fontWeight: "700",
    color: "#042f2e",
    fontSize: "14px",
    marginBottom: "4px",
  },
  categoryTag: {
    display: "inline-block",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 9px",
    borderRadius: "999px",
  },
  stockTd: {
    padding: "10px 14px",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
    minWidth: "130px",
  },
  stockCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  stockTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
  },
  cellActions: {
    display: "flex",
    gap: "4px",
  },
  barTrack: {
    width: "100%",
    height: "5px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },
  stockBadgeLow: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "5px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    minWidth: "38px",
    textAlign: "center",
    display: "inline-block",
  },
  stockBadgeMid: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    minWidth: "38px",
    textAlign: "center",
    display: "inline-block",
  },
  stockBadgeHigh: {
    background: "#d1fae5",
    color: "#065f46",
    padding: "5px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    minWidth: "38px",
    textAlign: "center",
    display: "inline-block",
  },
  stockBadgeEmpty: {
    background: "#f1f5f9",
    color: "#94a3b8",
    padding: "5px 12px",
    borderRadius: "999px",
    fontWeight: "600",
    fontSize: "13px",
    minWidth: "38px",
    textAlign: "center",
    display: "inline-block",
  },
  iconEditButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    borderRadius: "6px",
    width: "22px",
    height: "22px",
    fontSize: "11px",
    cursor: "pointer",
    lineHeight: "22px",
  },
  iconDeleteButton: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "none",
    borderRadius: "6px",
    width: "22px",
    height: "22px",
    fontSize: "11px",
    cursor: "pointer",
    lineHeight: "22px",
  },
  footerRow: {
    background: "#ecfdf5",
  },
  footerTd: {
    padding: "14px 12px",
    fontWeight: "800",
    color: "#042f2e",
    borderTop: "2px solid #a7f3d0",
  },
  footerTdValue: {
    padding: "14px 12px",
    fontWeight: "800",
    color: "#047857",
    textAlign: "center",
    borderTop: "2px solid #a7f3d0",
    fontSize: "15px",
  },
  empty: {
    color: "#475569",
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "10px",
  },
};