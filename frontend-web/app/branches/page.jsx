"use client";

import { useEffect, useState } from "react";
import { getBranches, addBranch } from "../../lib/api";

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ name: "" });

  const loadBranches = async () => {
    const result = await getBranches();
    setBranches(Array.isArray(result) ? result : result.data || []);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const result = await addBranch(form);
    console.log("Branch add result:", result);
  
    setForm({ name: "" });
    loadBranches();
  };

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Branches Management</h1>
      <p style={styles.subtitle}>Add and view bookstore branches.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Branch Name"
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          required
        />

        <button style={styles.button}>Add Branch</button>
      </form>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Branch List</h2>

        {branches.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Branch Name</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch._id}>
                  <td style={styles.td}>{branch.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.empty}>No branches available.</p>
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
    gridTemplateColumns: "1fr auto",
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