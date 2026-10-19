"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Pencil, Sparkles, Trash2 } from "lucide-react";
import { emotions, listBooks } from "@/lib/emobooks/api";
import type { BookPage, SavedBook } from "@/lib/emobooks/api";
import { AdminBookCover } from "./AdminBookPreview";

type Props = {
  revision: number;
  busy: boolean;
  onEdit: (book: SavedBook) => void;
  onDelete: (book: SavedBook) => Promise<void>;
};

export default function BookCatalog({ revision, busy, onEdit, onDelete }: Props) {
  const [catalog, setCatalog] = useState<BookPage | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listBooks(page, query, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (page > 1 && result.books.length === 0) { setPage(Math.max(1, Math.ceil(result.total / 8))); return; }
      setCatalog(result); setError(""); setLoading(false);
    }).catch((failure) => {
      if (!controller.signal.aborted) { setError(failure instanceof Error ? failure.message : "Cannot load saved books."); setLoading(false); }
    });
    return () => controller.abort();
  }, [revision, page, query, refresh]);

  async function remove(book: SavedBook) {
    setError("");
    try { await onDelete(book); setConfirm(null); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "The book could not be deleted."); }
  }

  return <section aria-labelledby="saved-books-heading" className="content-card mt-10">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="saved-books-heading" className="text-xl font-semibold">Saved books</h2><p className="mt-2 text-sm text-slate-500">Edit a book or remove it from the catalog.</p></div>
      <button type="button" disabled={busy || loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }} className="text-sm font-semibold text-teal-800 underline disabled:opacity-50">Refresh books</button>
    </div>
    <form className="my-6 flex gap-3" onSubmit={(event) => { event.preventDefault(); setLoading(true); setPage(1); setQuery(search.trim()); setRefresh((value) => value + 1); }}>
      <input aria-label="Search saved books" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author or ISBN" className="min-w-0 flex-1 rounded-full border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm" />
      <button disabled={busy} className="btn-primary">Search</button>
    </form>
    {loading && <p role="status" className="mb-4 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Loading books…</p>}
    {error && <div role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}<button type="button" onClick={() => { setLoading(true); setRefresh((value) => value + 1); }} className="ml-3 font-semibold underline">Retry loading books</button></div>}
    {!loading && !error && catalog?.total === 0 && <p className="py-6 text-sm text-slate-500">{query ? "No books match your search." : "No books saved yet. Add your first book above."}</p>}
    <div className="grid gap-5 sm:grid-cols-2">
      {catalog?.books.map((book) => <article key={book.id} aria-label={book.title} className="catalog-card">
        <div className="catalog-card__header">
          <AdminBookCover key={book.cover_url} src={book.cover_url} title={book.title} compact />
          <div className="min-w-0 flex-1">
            <h3 className="catalog-card__title">{book.title}</h3>
            <p className="catalog-card__author">{book.author}</p>
            {book.genres.length > 0 && <div className="catalog-card__genres">{book.genres.slice(0, 2).map((genre) => <span key={genre}>{genre}</span>)}{book.genres.length > 2 && <span>+{book.genres.length - 2}</span>}</div>}
          </div>
        </div>
        <p className="catalog-card__emotion"><Sparkles size={13} aria-hidden="true" /><span>Story emotion: <strong>{emotions.find((emotion) => emotion.id === book.classification.category)?.label}</strong></span></p>
        <p className="catalog-card__description line-clamp-3">{book.description}</p>
        <div className="catalog-card__actions">
          <button type="button" disabled={busy || loading} aria-label={`Edit ${book.title}`} onClick={() => onEdit(book)} className="catalog-card__edit"><Pencil size={15} aria-hidden="true" />Edit book</button>
          <button type="button" disabled={busy || loading} aria-label={`Delete ${book.title}`} onClick={() => setConfirm(book.id)} className="catalog-card__delete"><Trash2 size={15} aria-hidden="true" />Delete</button>
        </div>
        {confirm === book.id && <div role="alertdialog" aria-label={`Delete ${book.title}?`} className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">
          <p>Delete this book permanently from the catalog?</p><div className="mt-3 flex flex-wrap gap-4">
            <button type="button" disabled={busy} onClick={() => remove(book)} className="font-semibold underline disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button>
            <button type="button" disabled={busy} onClick={() => setConfirm(null)} className="underline disabled:opacity-50">Cancel</button>
          </div>
        </div>}
      </article>)}
    </div>
    {catalog && catalog.total > 0 && <nav aria-label="Saved book pages" className="mt-6 flex items-center justify-between gap-3 text-sm">
      <button type="button" disabled={busy || loading || page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }} className="font-medium text-teal-800 disabled:opacity-40">Previous</button>
      <p className="text-slate-500">Page {page} of {Math.max(1, Math.ceil(catalog.total / 8))} · {catalog.total} books</p>
      <button type="button" disabled={busy || loading || page * 8 >= catalog.total} onClick={() => { setLoading(true); setPage((value) => value + 1); }} className="font-medium text-teal-800 disabled:opacity-40">Next</button>
    </nav>}
  </section>;
}
