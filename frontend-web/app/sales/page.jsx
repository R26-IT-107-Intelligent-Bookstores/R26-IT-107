"use client";

import { useEffect, useState } from "react";
import {
  getBooks,
  getBranches,
  getSales,
  addSale,
  updateSale,
  deleteSale,
} from "../../lib/api";

export default function SalesPage() {
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sales, setSales] = useState([]);

  const [form, setForm] = useState({
    book: "",
    branch: "",
    quantitySold: "",
    saleDate: "",
  });

  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    const booksRes = await getBooks();
    const branchesRes = await getBranches();
    const salesRes = await getSales();

    setBooks(Array.isArray(booksRes) ? booksRes : booksRes.data || []);
    setBranches(Array.isArray(branchesRes) ? branchesRes : branchesRes.data || []);
    setSales(Array.isArray(salesRes) ? salesRes : salesRes.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      book: "",
      branch: "",
      quantitySold: "",
      saleDate: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const saleData = {
      book: form.book,
      branch: form.branch,
      quantitySold: Number(form.quantitySold),
      saleDate: form.saleDate,
    };

    const result = editingId
      ? await updateSale(editingId, saleData)
      : await addSale(saleData);

    if (result.error || result.success === false) {
      alert("Error: " + (result.error || "Failed to save sale"));
      return;
    }

    alert(editingId ? "Sale updated successfully" : "Sale recorded successfully");
    resetForm();
    loadData();
  };

  const handleEdit = (sale) => {
    setEditingId(sale._id);

    setForm({
      book: sale.book?._id || sale.book || "",
      branch: sale.branch?._id || sale.branch || "",
      quantitySold: sale.quantitySold || "",
      saleDate: sale.saleDate ? sale.saleDate.slice(0, 10) : "",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this sale?"
    );

    if (!confirmDelete) return;

    const result = await deleteSale(id);

    if (result.error || result.success === false) {
      alert("Error: " + (result.error || "Failed to delete sale"));
      return;
    }

    alert("Sale deleted successfully");
    loadData();
  };

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Sales Management</h1>
      <p style={styles.subtitle}>
        Record book sales to generate trends and predictions.
      </p>

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
          placeholder="Quantity Sold"
          value={form.quantitySold}
          onChange={(e) =>
            setForm({ ...form, quantitySold: e.target.value })
          }
          required
        />

        <input
          style={styles.input}
          type="date"
          value={form.saleDate}
          onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
          required
        />

        <button style={editingId ? styles.updateButton : styles.button}>
          {editingId ? "Update Sale" : "Record Sale"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm} style={styles.cancelButton}>
            Cancel
          </button>
        )}
      </form>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Sales History</h2>

        {sales.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Book</th>
                <th style={styles.th}>Branch</th>
                <th style={styles.th}>Quantity Sold</th>
                <th style={styles.th}>Sale Date</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td style={styles.td}>{sale.book?.title || "-"}</td>
                  <td style={styles.td}>{sale.branch?.name || "-"}</td>
                  <td style={styles.td}>{sale.quantitySold}</td>
                  <td style={styles.td}>
                    {sale.saleDate
                      ? new Date(sale.saleDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleEdit(sale)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(sale._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.empty}>No sales records yet.</p>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },
  title: { fontSize: "32px", marginBottom: "8px" },
  subtitle: { color: "#475569", marginBottom: "24px" },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr auto auto",
    gap: "12px",
    marginBottom: "24px",
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  input: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
  },
  button: {
    padding: "12px 18px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  updateButton: {
    padding: "12px 18px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "12px 18px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  cardTitle: { fontSize: "22px", marginBottom: "18px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#ecfdf5",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #bbf7d0",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  editButton: {
    background: "#f0ad32",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "8px",
  },
  deleteButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  empty: {
    color: "#64748b",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "10px",
  },
};