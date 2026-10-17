"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { BookPlus, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, LogOut, RefreshCw, Search, ShieldCheck } from "lucide-react";
import {
  addClassifiedBook, adminToken, checkAdminSession, clearAdminSession, EmoBooksApiError,
  emotionCategories, getAdminCatalog, getEmoBooksStatus, loginEmoBooksAdmin, logoutEmoBooksAdmin,
} from "@/lib/emobooks/adminApi";
import type { AdminBook, AdminBookInput, AdminCatalog, ServiceStatus } from "@/lib/emobooks/adminApi";
import AdminBookPreview from "./AdminBookPreview";

const emptyForm = { title: "", author: "", isbn: "", genres: "", description: "", classification_text: "", cover_url: "" };
const fieldStyle = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-normal text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50";
const primaryStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40";

function Scores({ book }: { book: AdminBook }) {
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{emotionCategories.map((emotion) => {
    const value = book.classification.probabilities[emotion.id] * 100;
    return <div key={emotion.id}><div className="mb-1.5 flex justify-between gap-3 text-xs"><dt>{emotion.label}</dt><dd className="font-semibold tabular-nums">{value.toFixed(1)}%</dd></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${emotion.id === book.classification.category ? "bg-teal-700" : "bg-slate-300"}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>;
  })}</dl>;
}

export default function EmoBooksAdmin() {
  const [session, setSession] = useState<{ status: "checking" | "signedOut" | "signedIn"; username: string }>({ status: "checking", username: "" });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [textSource, setTextSource] = useState<"introduction" | "excerpt">("introduction");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState<AdminBook | null>(null);
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const pending = useRef<{ payload: string; key: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  const handleSessionError = useCallback((error: unknown) => {
    if (error instanceof EmoBooksApiError && (error.status === 401 || error.status === 403)) {
      clearAdminSession();
      setSession({ status: "signedOut", username: "" });
      setLoginError(error.message);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!adminToken()) {
        if (active) setSession({ status: "signedOut", username: "" });
        return;
      }
      try {
        const user = await checkAdminSession();
        if (active) setSession({ status: "signedIn", username: user.username });
      } catch (error) {
        if (active) {
          setSession({ status: "signedOut", username: "" });
          setLoginError(error instanceof Error ? error.message : "Please sign in again.");
        }
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (session.status !== "signedIn") return;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), page_size: "12" });
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setListError("");
      try {
        const [books, status] = await Promise.all([getAdminCatalog(params, controller.signal), getEmoBooksStatus(controller.signal)]);
        if (!controller.signal.aborted) { setCatalog(books); setService(status); }
      } catch (error) {
        if (!controller.signal.aborted && !handleSessionError(error)) {
          setListError(error instanceof Error ? error.message : "Could not open the catalog.");
          setService(null);
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    });
    return () => controller.abort();
  }, [session.status, search, category, page, revision, handleSessionError]);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setLoginBusy(true); setLoginError("");
    try {
      const user = await loginEmoBooksAdmin(loginForm.username, loginForm.password);
      setLoginForm({ username: "", password: "" });
      setSession({ status: "signedIn", username: user.username });
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Sign in failed."); }
    finally { setLoginBusy(false); }
  }

  async function saveBook(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true); setSaveError(""); setSaved(null);
    const book: AdminBookInput = {
      ...form, title: form.title.trim(), author: form.author.trim(),
      description: form.description.trim(),
      classification_text: textSource === "excerpt" ? form.classification_text.trim() : "",
      genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
    };
    const payload = JSON.stringify(book);
    if (pending.current?.payload !== payload) pending.current = { payload, key: crypto.randomUUID() };
    try {
      const result = await addClassifiedBook(book, pending.current.key);
      setSaved(result); setForm(emptyForm); setTextSource("introduction"); setFileName(""); pending.current = null;
      if (fileInput.current) fileInput.current.value = "";
      setPage(1); setRevision((value) => value + 1);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (error) {
      if (!handleSessionError(error)) setSaveError(error instanceof Error ? error.message : "The book could not be saved.");
    } finally { setSaving(false); submitting.current = false; }
  }

  async function loadTextFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".txt") || file.size > 64000) throw new Error("Choose a plain .txt file up to 64 KB.");
      const text = await file.text();
      if (text.length > 16000) throw new Error("Use an excerpt of 16,000 characters or fewer.");
      setForm((previous) => ({ ...previous, classification_text: text })); setSaveError("");
      setTextSource("excerpt"); setFileName(file.name);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "The text file could not be read."); }
  }

  if (session.status === "checking") return <main className="flex flex-1 items-center justify-center gap-3 bg-slate-50 p-12" role="status"><LoaderCircle className="animate-spin text-teal-700" /> Opening EmoBooks administration…</main>;
  if (session.status === "signedOut") return <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-14"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><ShieldCheck size={34} className="mb-5 text-teal-800" /><p className="text-xs font-bold uppercase tracking-widest text-teal-700">EmoBooks administration</p><h1 className="mt-3 text-2xl font-semibold text-slate-900">Sign in to manage books</h1><p className="mb-7 mt-3 text-sm leading-6 text-slate-500">Use your EmoBooks admin account to add books and organise them by emotion.</p><form onSubmit={signIn} className="space-y-5"><label className="block text-sm font-medium text-slate-700">Username<input autoComplete="username" required value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} className={fieldStyle} /></label><label className="block text-sm font-medium text-slate-700">Password<input type="password" autoComplete="current-password" required value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className={fieldStyle} /></label>{loginError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{loginError}</p>}<button disabled={loginBusy} className={`${primaryStyle} w-full`}>{loginBusy && <LoaderCircle size={17} className="animate-spin" />}Sign in</button></form></section></main>;

  return <main className="flex-1 bg-[#f5f7f5] px-5 py-8 text-slate-800 sm:px-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Bookstore administration / EmoBooks</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">EmoBooks admin dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Add a book, introduce its story, and publish it for readers to discover by emotion.</p></div><div className="flex flex-wrap items-center gap-3"><span className="max-w-60 truncate text-xs text-slate-500">{session.username}</span><Link href="/emobooks" className={secondaryStyle}>Reader dashboard</Link><button type="button" disabled={saving} className={secondaryStyle} onClick={async () => { try { await logoutEmoBooksAdmin(); } catch { /* Local session is already cleared. */ } setSession({ status: "signedOut", username: "" }); setSaved(null); setCatalog(null); }}><LogOut size={16} /> Sign out</button></div></header>
    <ol aria-label="Book publishing workflow" className="mb-7 grid gap-3 text-sm sm:grid-cols-3">{["Add book details", "Analyze the story emotion", "Publish to the reader catalog"].map((step, index) => <li key={step} className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-800">{index + 1}</span>{step}</li>)}</ol>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap gap-x-6 gap-y-2 text-xs"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${service?.database === "connected" ? "bg-emerald-500" : "bg-amber-400"}`} />{service ? "Catalog connected" : "Checking catalog connection"}</span><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${service?.model.files_ready ? "bg-emerald-500" : "bg-amber-400"}`} />{service?.model.files_ready ? "Emotion classifier ready" : "Emotion classifier needs setup"}</span></div><button type="button" disabled={loading} className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 disabled:opacity-40" onClick={() => setRevision((value) => value + 1)}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button></div>
    {listError && <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{listError}</p>}
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><div className="mb-7 flex items-start gap-3"><span className="rounded-xl bg-teal-50 p-3 text-teal-800"><BookPlus size={22} /></span><div><h2 className="text-xl font-semibold">Add and publish a book</h2><p className="mt-1 text-xs leading-6 text-slate-500">Fields marked * are required. The story emotion is assigned automatically.</p></div></div>
        <form onSubmit={saveBook} className="space-y-5"><fieldset disabled={saving} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Book details and story input</legend>
          <label className="block text-sm font-semibold">Book title <span className="text-rose-600">*</span><input required maxLength={250} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldStyle} /></label>
          <label className="block text-sm font-semibold">Author <span className="text-rose-600">*</span><input required maxLength={250} value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className={fieldStyle} /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold">ISBN <span className="font-normal text-slate-400">optional</span><input maxLength={32} value={form.isbn} onChange={(event) => setForm({ ...form, isbn: event.target.value })} className={fieldStyle} /></label><label className="block text-sm font-semibold">Genres <span className="font-normal text-slate-400">optional</span><input maxLength={600} placeholder="Fantasy, Adventure" value={form.genres} onChange={(event) => setForm({ ...form, genres: event.target.value })} className={fieldStyle} /><span className="mt-1 block text-xs font-normal text-slate-400">Separate up to 10 genres with commas. These also help match readers&apos; preferences.</span></label></div>
          <label className="block text-sm font-semibold">Short introduction for readers <span className="text-rose-600">*</span><textarea required minLength={20} maxLength={5000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Briefly introduce the story, its characters and what happens." className={fieldStyle} /><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">Shown on book cards and the reader&apos;s book detail page. At least 20 characters.</span></label>
          <label className="block text-sm font-semibold">Cover image URL <span className="font-normal text-slate-400">optional</span><input maxLength={2000} placeholder="https://... or /images/books/..." value={form.cover_url} onChange={(event) => setForm({ ...form, cover_url: event.target.value })} className={fieldStyle} /></label>
          <fieldset className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 sm:p-5"><legend className="px-2 text-sm font-semibold text-teal-900">Story text for emotion analysis *</legend><p className="mb-4 text-xs leading-6 text-slate-600">The classifier reads English story content. Titles, authors and the reader introduction can use Sinhala when separate English text is supplied.</p>
            <div className="space-y-3"><label className="flex cursor-pointer items-center gap-3 text-sm"><input type="radio" name="emo-text-source" checked={textSource === "introduction"} onChange={() => { setTextSource("introduction"); setSaveError(""); }} className="accent-teal-700" />Use the introduction (English)</label><label className="flex cursor-pointer items-center gap-3 text-sm"><input type="radio" name="emo-text-source" checked={textSource === "excerpt"} onChange={() => { setTextSource("excerpt"); setSaveError(""); }} className="accent-teal-700" />Use separate English text or a .txt file</label></div>
            {textSource === "excerpt" ? <div className="mt-5"><label htmlFor="emo-story-text" className="block text-sm font-semibold">English synopsis or story excerpt *</label><textarea id="emo-story-text" required minLength={20} maxLength={16000} rows={5} value={form.classification_text} onChange={(event) => { setForm({ ...form, classification_text: event.target.value }); setFileName(""); }} placeholder="Describe what happens in the story, or paste an English excerpt." className={fieldStyle} /><div className="mt-3 flex flex-wrap items-end justify-between gap-3"><label className="text-xs font-medium text-teal-800">Upload English text (.txt)<input ref={fileInput} type="file" accept=".txt,text/plain" onChange={loadTextFile} className="mt-2 block max-w-full text-xs font-normal text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-teal-800" /></label><span className="text-xs text-slate-500">{form.classification_text.length.toLocaleString()}/16,000 characters</span></div>{fileName && <p className="mt-2 text-xs text-teal-800">Loaded {fileName}</p>}<p className="mt-3 text-xs leading-6 text-slate-500">Use a UTF-8 .txt file up to 64 KB. Readers see the short introduction; this text is used for story analysis.</p></div> : <p className="mt-4 text-xs leading-6 text-teal-800">Your introduction above will be analyzed. Include at least four English words describing the story. Choose separate English text if your introduction is in Sinhala.</p>}
          </fieldset>
          <section aria-label="Reader card preview" className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Reader card preview</p><AdminBookPreview book={form} /></section>
        </fieldset>
        {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-800">{saveError}</p>}
        <button disabled={saving || !service?.model.files_ready} className={`${primaryStyle} w-full`}>{saving ? <><LoaderCircle size={18} className="animate-spin" /> Analyzing and publishing...</> : <><BookPlus size={18} /> Analyze &amp; publish book</>}</button>
        {saving && <p role="status" className="text-center text-xs leading-6 text-slate-500">Analyzing the story and saving the classified book. The first book can take longer while the classifier starts.</p>}
        </form>
        {saved && <section aria-labelledby="emo-saved-result" className="mt-7 rounded-2xl border border-teal-200 bg-teal-50/60 p-5"><h3 id="emo-saved-result" ref={resultHeading} tabIndex={-1} className="flex items-center gap-2 font-semibold text-teal-900 outline-none"><CheckCircle2 size={18} /> Published to the reader catalog</h3><p className="mb-4 mt-3 text-sm leading-6"><strong>{saved.title}</strong><br />Story emotion: {emotionCategories.find((item) => item.id === saved.classification.category)?.label}</p><div className="mb-5 flex flex-wrap gap-3"><Link href={`/emobooks/books/${saved.id}`} className="text-xs font-semibold text-teal-800 underline underline-offset-4">View book as a reader</Link><Link href="/emobooks/discover" className="text-xs font-semibold text-teal-800 underline underline-offset-4">Open emotion discovery</Link></div><Scores book={saved} /><p className="mt-4 text-xs leading-6 text-slate-500">Readers can find this book by its story emotion. Scores describe the story text.</p></section>}
      </section>
      <section className="min-w-0"><div className="mb-5"><h2 className="text-xl font-semibold">Classified bookshelf</h2><p className="mt-2 text-xs leading-6 text-slate-500">Saved books and their emotion categories, loaded from your catalog.</p></div>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">{emotionCategories.map((emotion) => <button key={emotion.id} type="button" aria-pressed={category === emotion.id} onClick={() => { setCategory(category === emotion.id ? "" : emotion.id); setPage(1); }} className={`rounded-xl border p-3 text-left transition-colors ${category === emotion.id ? "border-teal-700 bg-teal-50 ring-1 ring-teal-700" : "border-slate-200 bg-white hover:border-teal-400"}`}><span className="block text-lg font-semibold">{catalog?.category_counts[emotion.id] ?? "—"}</span><span className="mt-1 block text-[11px] text-slate-500">{emotion.label}</span></button>)}</div>
        <div className="relative mb-5"><Search size={17} className="absolute left-4 top-3.5 text-slate-400" /><label htmlFor="emo-admin-search" className="sr-only">Search saved books by title, author or ISBN</label><input id="emo-admin-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author or ISBN" className={`${fieldStyle} mt-0 pl-11`} /></div>
        {category && <button type="button" onClick={() => { setCategory(""); setPage(1); }} className="mb-4 text-xs font-semibold text-teal-800">Clear emotion filter ×</button>}
        {loading ? <p role="status" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Opening saved books…</p> : catalog?.books.length ? <div className="space-y-4">{catalog.books.map((book) => {
          const emotion = emotionCategories.find((item) => item.id === book.classification.category);
          return <article key={book.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><AdminBookPreview book={book} /></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${emotion?.color}`}>{emotion?.label}</span></div>{book.genres.length > 0 && <p className="mt-3 text-xs text-teal-700">{book.genres.join(" · ")}</p>}<details className="mt-4 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-xs font-semibold text-teal-800">View emotion scores</summary><div className="mt-5"><Scores book={book} /></div><p className="mt-4 text-xs leading-6 text-slate-400">{book.isbn ? `ISBN ${book.isbn} · ` : ""}Saved {new Date(book.created_at).toLocaleDateString()} · {book.classification.chunks} text {book.classification.chunks === 1 ? "section" : "sections"} analysed</p></details></article>;
        })}</div> : !listError && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-7 py-12 text-center"><BookPlus size={30} className="mx-auto text-teal-700" /><h3 className="mt-4 text-lg font-semibold">{search || category ? "No matching books" : "Your catalog starts here"}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{search || category ? "Try a different search or emotion category." : "Add your first book to see its emotion category and scores here."}</p></div>}
        {catalog && catalog.total > 0 && <div className="mt-6 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{catalog.total} {catalog.total === 1 ? "book" : "books"} · Page {page} of {Math.max(1, Math.ceil(catalog.total / 12))}</span><div className="flex gap-2"><button type="button" aria-label="Previous page" disabled={loading || page === 1} onClick={() => setPage((value) => value - 1)} className={secondaryStyle}><ChevronLeft size={17} /></button><button type="button" aria-label="Next page" disabled={loading || page * 12 >= catalog.total} onClick={() => setPage((value) => value + 1)} className={secondaryStyle}><ChevronRight size={17} /></button></div></div>}
      </section>
    </div>
  </div></main>;
}
