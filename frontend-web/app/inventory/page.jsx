"use client";

import { useEffect, useState } from "react";
import { getBooks, getBranches, getInventory, addInventory } from "../../lib/api";

export default function InventoryPage() {
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);

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

    await addInventory({
      book: form.book,
      branch: form.branch,
      quantity: Number(form.quantity),
    });

    setForm({
      book: "",
      branch: "",
      quantity: "",
    });

    loadData();
  };

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Inventory Management</h1>
      <p style={styles.subtitle}>
        Link books to branches and manage stock quantity.
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
          placeholder="Stock Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />

        <button style={styles.button}>Add Inventory</button>
      </form>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Inventory List</h2>

        {inventory.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Book</th>
                <th style={styles.th}>Branch</th>
                <th style={styles.th}>Stock Quantity</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item._id}>
                  <td style={styles.td}>{item.book?.title || "-"}</td>
                  <td style={styles.td}>{item.branch?.name || "-"}</td>
                  <td style={styles.td}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    padding: "40px",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },
  title: { fontSize: "32px", marginBottom: "8px" },
  subtitle: { color: "#475569", marginBottom: "24px" },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
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
    background: "white",
  },
  button: {
    padding: "12px 18px",
    background: "#2563eb",
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
    background: "#eff6ff",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #bfdbfe",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  empty: {
    color: "#64748b",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "10px",
  },
};