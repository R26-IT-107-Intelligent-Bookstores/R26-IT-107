"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CatalogError, getBook } from "@/lib/emobooks/catalogApi";
import type { Book } from "@/lib/emobooks/types";
import BookDetails from "./BookDetails";

export default function BookDetailLoader({ id }: { id: string }) {
  const [state, setState] = useState<{ id: string; book?: Book; error?: string; missing?: boolean }>({ id: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getBook(id, controller.signal).then((book) => {
      if (!controller.signal.aborted) setState({ id, book });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ id, error: error instanceof Error ? error.message : "This book could not be loaded.", missing: error instanceof CatalogError && error.status === 404 });
    });
    return () => controller.abort();
  }, [id, retry]);
  if (state.id !== id) return <p role="status">Opening your book…</p>;
  if (state.book) return <BookDetails book={state.book} />;
  return <div role="alert" className="emo-panel p-10 text-center"><h1 className="text-2xl font-semibold">{state.missing ? "This story is no longer available." : "Your book needs another try."}</h1><p className="my-4 text-sm text-slate-500">{state.error}</p>{!state.missing && <button type="button" className="emo-primary" onClick={() => { setState({ id: "" }); setRetry((value) => value + 1); }}>Try again</button>}<Link href="/discover" className="emo-secondary ml-3">Find another book</Link></div>;
}
