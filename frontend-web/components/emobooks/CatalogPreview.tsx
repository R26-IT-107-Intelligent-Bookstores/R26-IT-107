"use client";

import Image from "next/image";
import { BookOpen } from "lucide-react";
import BookCard from "./BookCard";
import { useEmoBooks } from "./EmoBooksProvider";

export default function CatalogPreview() {
  const { catalog, catalogLoading, catalogError, refreshCatalog } = useEmoBooks();
  if (catalogLoading) return <p role="status" className="text-sm text-slate-500">Opening the book catalog…</p>;
  if (catalogError) return <div role="alert" className="emo-panel p-6"><p className="mb-4 text-sm">{catalogError}</p><button type="button" onClick={refreshCatalog} className="emo-secondary">Try again</button></div>;
  if (!catalog.length) return <p className="emo-panel p-6 text-sm text-slate-500">New stories will appear here as they join the catalog.</p>;
  return <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">{catalog.slice(0, 3).map((book) => <BookCard key={book.id} book={book} />)}</div>;
}

export function CatalogHero() {
  const { catalog } = useEmoBooks();
  return <div className="emo-book-stack relative flex items-center gap-1 sm:gap-3">{[0, 1, 2].map((index) => {
    const book = catalog[index];
    return <div key={index} className={"relative flex h-44 w-24 items-center justify-center overflow-hidden rounded-sm border-l-4 border-white/20 bg-[#416457] p-3 text-center text-[#edcf92] sm:h-64 sm:w-36 " + (index === 0 ? "-rotate-12 translate-x-2 translate-y-7" : index === 2 ? "rotate-12 -translate-x-2 translate-y-7" : "z-10 -translate-y-4")}>
      <div><BookOpen className="mx-auto mb-4" /><p className="font-serif text-xs sm:text-base">{book?.title || "Your next chapter"}</p></div>
      {book?.coverUrl && <Image src={book.coverUrl} alt="" unoptimized fill sizes="(max-width: 640px) 96px, 144px" className="object-cover" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />}
    </div>;
  })}</div>;
}
