"use client";

import { useEffect, useState } from "react";
import { getBooks, addBook, deleteBook, updateBook } from "../../lib/api";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
  });

  const loadBooks = async () => {
    const result = await getBooks();
    setBooks(Array.isArray(result) ? result : result.data || []);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      author: "",
      isbn: "",
      category: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await updateBook(editingId, form);
    } else {
      await addBook(form);
    }

    resetForm();
    loadBooks();
  };

  const handleEdit = (book) => {
    setEditingId(book._id);

    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: book.category || "",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this book?"
    );

    if (!confirmDelete) return;

    await deleteBook(id);
    loadBooks();
  };

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Books Management</h1>

      <p style={styles.subtitle}>
        Add, view, update, and delete bookstore book records.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Book Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <input
          style={styles.input}
          placeholder="Author"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          required
        />

        <input
          style={styles.input}
          placeholder="ISBN"
          value={form.isbn}
          onChange={(e) => setForm({ ...form, isbn: e.target.value })}
        />

        <select
          style={styles.input}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="නවකතා (Novel)">නවකතා (Novel)</option>
          <option value="පරිවර්තන (Translation)">පරිවර්තන (Translation)</option>
          <option value="කෙටිකතා (Short Stories)">කෙටිකතා (Short Stories)</option>
          <option value="ළමා පොත් (Children)">ළමා පොත් (Children)</option>
          <option value="අධ්‍යාපනික (Education)">අධ්‍යාපනික (Education)</option>
          <option value="ආගමික (Religious)">ආගමික (Religious)</option>
          <option value="ඉතිහාසය (History)">ඉතිහාසය (History)</option>
          <option value="විද්‍යාව (Science)">විද්‍යාව (Science)</option>
          <option value="ව්‍යාපාර (Business)">ව්‍යාපාර (Business)</option>
          <option value="තාක්ෂණය (Technology)">තාක්ෂණය (Technology)</option>
        </select>

        <button style={styles.button}>
          {editingId ? "Update Book" : "Add Book"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        )}
      </form>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Book List</h2>

        {books.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "32%" }}>Title</th>
                <th style={{ ...styles.th, width: "22%" }}>Author</th>
                <th style={{ ...styles.th, width: "18%" }}>ISBN</th>
                <th style={{ ...styles.th, width: "18%" }}>Category</th>
                <th style={{ ...styles.th, width: "10%" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {books.map((book) => (
                <tr key={book._id}>
                  <td style={{ ...styles.td, wordBreak: "break-word" }}>
                    {book.title}
                  </td>

                  <td style={{ ...styles.td, wordBreak: "break-word" }}>
                    {book.author}
                  </td>

                  <td style={styles.td}>{book.isbn || "-"}</td>

                  <td style={styles.td}>{book.category || "-"}</td>

                  <td style={styles.actionTd}>
                    <button
                      onClick={() => handleEdit(book)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(book._id)}
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
          <p style={styles.empty}>No books available.</p>
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

  title: {
    fontSize: "32px",
    marginBottom: "8px",
    fontWeight: "normal",
  },

  subtitle: {
    color: "#475569",
    marginBottom: "24px",
  },

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
    fontSize: "15px",
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

  cardTitle: {
    fontSize: "22px",
    marginBottom: "18px",
    fontWeight: "normal",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
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
    verticalAlign: "middle",
  },

  actionTd: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },

  empty: {
    color: "#64748b",
    background: "#f1f5f9",
    padding: "14px",
    borderRadius: "10px",
  },

  editButton: {
    padding: "8px 12px",
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "8px",
  },

  deleteButton: {
    padding: "8px 12px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};