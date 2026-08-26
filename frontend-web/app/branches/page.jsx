"use client";
import navbar from "../../components/Navbar";
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
    padding: "40px 5%",
    background: "#ffffff",
    fontFamily: '"Inter", "Arial", sans-serif',
    color: "#042f2e",
  },
  title: { fontSize: "32px", marginBottom: "8px", fontWeight: "800", color: "#042f2e" },
  subtitle: { color: "#475569", marginBottom: "24px" },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
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
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  },
  cardTitle: { fontSize: "22px", marginBottom: "18px", fontWeight: "800", color: "#042f2e" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#ecfdf5",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #a7f3d0",
    color: "#042f2e",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
  },
  empty: {
    color: "#475569",
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "10px",
  },
};