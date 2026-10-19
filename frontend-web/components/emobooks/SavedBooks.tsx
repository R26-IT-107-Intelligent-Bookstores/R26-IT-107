"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark } from "lucide-react";
import { lookupBooks } from "@/lib/emobooks/catalogApi";
import type { Book } from "@/lib/emobooks/types";
import { useEmoBooks } from "./EmoBooksProvider";
import BookCard from "./BookCard";

export default function SavedBooks() {
  const { savedIds, toggleSaved, ready } = useEmoBooks();
  const [state, setState] = useState<{ key: string; books: Book[]; error?: string }>({ key: "", books: [] });
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify(savedIds);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    lookupBooks(savedIds, controller.signal).then((books) => {
      if (!controller.signal.aborted) setState({ key: JSON.stringify(savedIds), books });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key: JSON.stringify(savedIds), books: [], error: error instanceof Error ? error.message : "Your saved books could not be loaded." });
    });
    return () => controller.abort();
  }, [savedIds, ready, retry]);
  const missing = savedIds.filter((id) => !state.books.some((book) => book.id === id));
  return <>
    <p className="emo-eyebrow text-center">For another day, another mood</p>
    <h1 className="main-title mt-3 tracking-tight">Your little <span className="text-teal-700">bookshelf.</span></h1>
    <p className="sub-title mb-9 mt-4">Stories you want to come back to. Saved in this browser, just for you.</p>
    {!ready || state.key !== key ? <p role="status">Opening your bookshelf...</p> : state.error ? <div role="alert" className="emo-panel p-8"><p className="mb-4">{state.error}</p><button type="button" className="emo-secondary" onClick={() => { setState({ key: "", books: [] }); setRetry((value) => value + 1); }}>Try again</button></div> : <>
      {missing.length > 0 && <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm"><p>Some saved books are no longer in the catalog.</p><button type="button" className="mt-2 font-semibold text-teal-800" onClick={() => missing.forEach(toggleSaved)}>Remove unavailable books</button></div>}
      {state.books.length ? <><p role="status" className="mb-5 text-sm text-slate-500">{state.books.length} saved {state.books.length === 1 ? "book" : "books"}</p><div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">{state.books.map((book) => <BookCard key={book.id} book={book} />)}</div></> : <div className="emo-panel px-6 py-16 text-center"><span className="mx-auto mb-6 inline-flex rounded-full bg-emerald-50 p-5 text-teal-700"><Bookmark size={30} strokeWidth={1.5} /></span><h2 className="text-3xl font-semibold">A shelf full of possibilities.</h2><p className="mx-auto mb-7 mt-3 max-w-md text-sm leading-7 text-slate-500">Find your next read and tap its bookmark to keep it here.</p><Link href="/emobooks" className="emo-primary">Find a book to save <ArrowRight size={17} /></Link></div>}
    </>}
  </>;
}
