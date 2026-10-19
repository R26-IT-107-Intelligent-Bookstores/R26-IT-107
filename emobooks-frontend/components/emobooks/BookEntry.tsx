"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BookOpen, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { addBook, deleteBook, emotions, getStatus, updateBook } from "@/lib/emobooks/api";
import type { BookInput, SavedBook, ServiceStatus } from "@/lib/emobooks/api";
import AdminBookPreview from "./AdminBookPreview";
import BookCatalog from "./BookCatalog";

const emptyForm = { title: "", author: "", isbn: "", genres: "", description: "", classification_text: "", cover_url: "" };
const field = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-normal text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50";

export default function BookEntry() {
  const [form, setForm] = useState(emptyForm);
  const [textSource, setTextSource] = useState<"introduction" | "excerpt">("introduction");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<SavedBook | null>(null);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedBook | null>(null);
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [serviceError, setServiceError] = useState("");
  const [revision, setRevision] = useState(0);
  const pending = useRef<{ payload: string; key: string } | null>(null);
  const submitting = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getStatus(controller.signal).then((status) => {
      if (!controller.signal.aborted) { setService(status); setServiceError(""); }
    }).catch((failure) => {
      if (!controller.signal.aborted) { setService(null); setServiceError(failure instanceof Error ? failure.message : "Cannot check the catalog connection."); }
    });
    return () => controller.abort();
  }, [revision]);

  async function saveBook(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || deleting) return;
    submitting.current = true;
    setSaving(true); setError(""); setSaved(null);
    const book: BookInput = {
      ...form, title: form.title.trim(), author: form.author.trim(), description: form.description.trim(),
      classification_text: textSource === "excerpt" ? form.classification_text.trim() : "",
      genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
    };
    const payload = JSON.stringify(book);
    if (pending.current?.payload !== payload) pending.current = { payload, key: crypto.randomUUID() };
    try {
      const result = editing ? await updateBook(editing.id, book) : await addBook(book, pending.current.key);
      setUpdated(Boolean(editing)); setEditing(null);
      setSaved(result); setForm(emptyForm); setTextSource("introduction"); setFileName(""); pending.current = null;
      if (fileInput.current) fileInput.current.value = "";
      setRevision((value) => value + 1);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The book could not be saved.");
    } finally { setSaving(false); submitting.current = false; }
  }

  function editBook(book: SavedBook) {
    if (saving || deleting) return;
    setEditing(book); setSaved(null); setError(""); pending.current = null;
    setForm({ title: book.title, author: book.author, isbn: book.isbn, genres: book.genres.join(", "),
      description: book.description, classification_text: book.classification_text, cover_url: book.cover_url });
    setTextSource(book.classification_text ? "excerpt" : "introduction"); setFileName("");
    if (fileInput.current) fileInput.current.value = "";
    requestAnimationFrame(() => titleInput.current?.focus());
  }

  function cancelEdit() {
    setEditing(null); setForm(emptyForm); setTextSource("introduction"); setFileName(""); setError(""); pending.current = null;
    if (fileInput.current) fileInput.current.value = "";
  }

  async function removeBook(book: SavedBook) {
    if (submitting.current || deleting) throw new Error("Wait for the current change to finish.");
    setDeleting(true);
    try {
      await deleteBook(book.id);
      if (editing?.id === book.id) cancelEdit();
      if (saved?.id === book.id) setSaved(null);
      setRevision((value) => value + 1);
    } finally { setDeleting(false); }
  }

  async function loadTextFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".txt") || file.size > 64000) throw new Error("Choose a plain .txt file up to 64 KB.");
      const text = await file.text();
      if (text.length > 16000) throw new Error("Use an excerpt of 16,000 characters or fewer.");
      setForm((previous) => ({ ...previous, classification_text: text }));
      setTextSource("excerpt"); setFileName(file.name); setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The text file could not be read."); }
  }

  return <main className="page-container mx-auto max-w-6xl">
    <header className="mb-8 flex flex-col items-center gap-4 text-center">
      <span className="rounded-2xl bg-teal-700 p-3 text-white"><BookOpen size={28} /></span>
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-teal-700">EmoBooks</p><h1 className="main-title mt-2 tracking-tight">{editing ? "Edit book" : "Add a book"}</h1><p className="sub-title max-w-2xl">Introduce the book, analyse the story emotion, and save it to your catalog.</p></div>
    </header>
    <div className="content-card mb-7 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex flex-wrap gap-5"><span>{service?.database === "connected" ? "● Catalog connected" : "○ Catalog connection pending"}</span><span>{service?.model.files_ready ? "● Emotion model ready" : "○ Emotion model pending"}</span></div>
      <button type="button" onClick={() => setRevision((value) => value + 1)} className="font-semibold text-teal-800 underline underline-offset-4">Check connection</button>
      {serviceError && <p role="status" className="w-full text-amber-800">{serviceError}</p>}
    </div>
    <div className="grid items-start gap-7 lg:grid-cols-[1.35fr_1fr]">
      <section className="content-card" aria-labelledby="book-details-heading">
        <h2 id="book-details-heading" className="text-xl font-semibold">Book details</h2>
        <form onSubmit={saveBook} className="mt-6 space-y-5">
          <fieldset disabled={saving || deleting} className="space-y-5 disabled:opacity-70">
            <label className="block text-sm font-semibold">Book title *<input ref={titleInput} required maxLength={250} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={field} /></label>
            <label className="block text-sm font-semibold">Author *<input required maxLength={250} value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className={field} /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold">ISBN <span className="font-normal text-slate-400">optional</span><input maxLength={32} value={form.isbn} onChange={(event) => setForm({ ...form, isbn: event.target.value })} className={field} /></label>
              <label className="block text-sm font-semibold">Genres <span className="font-normal text-slate-400">comma separated</span><input value={form.genres} onChange={(event) => setForm({ ...form, genres: event.target.value })} placeholder="Adventure, Drama" className={field} /></label>
            </div>
            <label className="block text-sm font-semibold">Short introduction for readers *<textarea required minLength={20} maxLength={5000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={field} /></label>
            <label className="block text-sm font-semibold">Cover image URL <span className="font-normal text-slate-400">optional</span><input maxLength={2000} value={form.cover_url} onChange={(event) => setForm({ ...form, cover_url: event.target.value })} placeholder="https://..." className={field} /></label>
            <fieldset className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
              <legend className="px-2 text-sm font-semibold text-teal-900">Story text for emotion analysis</legend>
              <p className="text-xs leading-6 text-slate-600">The classifier reads English story text. You can use Sinhala for the title and introduction when you supply a separate English excerpt.</p>
              <label className="flex items-center gap-3 text-sm"><input type="radio" name="text-source" checked={textSource === "introduction"} onChange={() => setTextSource("introduction")} />Use the introduction (English)</label>
              <label className="flex items-center gap-3 text-sm"><input type="radio" name="text-source" checked={textSource === "excerpt"} onChange={() => setTextSource("excerpt")} />Use separate English text or a .txt file</label>
              {textSource === "excerpt" && <><label className="block text-sm font-semibold">English synopsis or story excerpt *<textarea required maxLength={16000} rows={7} value={form.classification_text} onChange={(event) => setForm({ ...form, classification_text: event.target.value })} className={field} /></label><label className="block text-sm font-medium">Upload English text (.txt)<input ref={fileInput} type="file" accept=".txt,text/plain" onChange={loadTextFile} className="mt-2 block w-full text-xs" /></label>{fileName && <p className="text-xs text-teal-800">Loaded {fileName}</p>}</>}
            </fieldset>
          </fieldset>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-800">{error}</p>}
          <div className="flex flex-wrap items-center gap-4"><button type="submit" disabled={saving || deleting} className="btn-primary">{saving ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}{saving ? "Analysing and saving…" : editing ? "Save changes" : "Analyze & save book"}</button>
          {editing && <button type="button" disabled={saving || deleting} onClick={cancelEdit} className="text-sm font-semibold text-slate-600 underline disabled:opacity-50">Cancel editing</button>}</div>
          {editing && <p className="text-xs leading-6 text-teal-800">Editing {editing.title}. Changing the story text will update its emotion analysis.</p>}
          <p className="text-xs leading-6 text-slate-500">The book is saved after emotion analysis succeeds. Longer excerpts can take a little more time.</p>
        </form>
      </section>
      <aside className="space-y-6">
        <section aria-label="Book preview" className="content-card"><h2 className="mb-5 text-lg font-semibold">Book preview</h2><AdminBookPreview book={form} /></section>
        {saved && <section aria-labelledby="saved-book-heading" className="content-card">
          <CheckCircle2 size={28} className="text-emerald-700" /><h2 id="saved-book-heading" ref={resultHeading} tabIndex={-1} className="mt-3 text-xl font-semibold">{updated ? "Book updated in the catalog" : "Book saved to the catalog"}</h2>
          <p className="mt-3 font-medium">{saved.title}</p><p className="mt-2 text-sm text-teal-800">Story emotion: {emotions.find((emotion) => emotion.id === saved.classification.category)?.label}</p>
          <dl className="mt-6 space-y-3">{emotions.map((emotion) => <div key={emotion.id} className="flex justify-between gap-3 text-sm"><dt>{emotion.label}</dt><dd className="font-medium tabular-nums">{(saved.classification.probabilities[emotion.id] * 100).toFixed(1)}%</dd></div>)}</dl>
          <p className="mt-5 text-xs leading-6 text-slate-500">Scores describe the story text. {saved.classification.chunks} text {saved.classification.chunks === 1 ? "section" : "sections"} analysed.</p>
        </section>}
      </aside>
    </div>
    <BookCatalog revision={revision} busy={saving || deleting} onEdit={editBook} onDelete={removeBook} />
  </main>;
}
