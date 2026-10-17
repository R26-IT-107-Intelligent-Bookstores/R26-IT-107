"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Bookmark, BookOpen } from "lucide-react";
import { useEmoBooks } from "./EmoBooksProvider";
import type { Book, RecommendationResult } from "@/lib/emobooks/types";

export function BookCover({ book, large = false }: { book: Book; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={`emo-cover-stage relative flex items-center justify-center overflow-hidden rounded-xl ${large ? "h-96 sm:h-[460px]" : "h-64 sm:h-72"}`}>
    {failed || !book.coverUrl ? <div className="p-6 text-center text-teal-800"><BookOpen size={40} className="mx-auto mb-4" /><p className="font-semibold">{book.title}</p></div> : <Image src={book.coverUrl} alt={`Cover of ${book.title}`} unoptimized fill sizes={large ? "(max-width: 640px) 90vw, 350px" : "(max-width: 640px) 90vw, 300px"} className="object-contain p-5 transition-transform duration-300 group-hover:scale-105" onError={() => setFailed(true)} />}
  </div>;
}

export function SaveButton({ book, full = false }: { book: Book; full?: boolean }) {
  const { savedIds, toggleSaved, ready } = useEmoBooks();
  const saved = savedIds.includes(book.id);
  return <button type="button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${book.title}${saved ? " from saved books" : " to saved books"}`} onClick={() => toggleSaved(book.id)} className={full ? "emo-secondary" : "rounded-full border border-slate-100 bg-white p-2.5 text-teal-800 shadow-sm hover:bg-teal-50"}><Bookmark size={18} className={saved ? "fill-teal-700" : ""} />{full && (saved ? "Saved to your shelf" : "Save to my shelf")}</button>;
}

export default function BookCard({ book, result }: { book: Book; result?: RecommendationResult }) {
  return <article className="emo-panel emo-card group flex h-full flex-col overflow-hidden p-3">
    <div className="relative"><Link href={`/emobooks/books/${book.id}`} aria-label={`Read about ${book.title}`}><BookCover book={book} /></Link><div className="absolute right-3 top-3"><SaveButton book={book} /></div>{result && <span className="absolute bottom-3 left-3 rounded-full bg-[#193f35] px-3 py-2 text-xs font-medium text-[#efd9aa] shadow-sm">Relevance · {result.finalScore.toFixed(1)}/100</span>}</div>
    <div className="flex flex-1 flex-col p-3 pt-5 sm:p-4 sm:pt-5">
      <div className="mb-3 flex flex-wrap gap-1.5">{book.genres.map((genre) => <span key={genre} className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">{genre}</span>)}</div>
      <Link href={`/emobooks/books/${book.id}`} className="text-lg font-bold leading-7 hover:text-teal-700">{book.title}</Link>
      <p className="mt-1 text-xs leading-5 text-slate-500">{book.author}</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">{book.description}</p>
      {result && <div className="mt-4 rounded-xl border border-[#e0e7d8] bg-[#f0f4e9] p-4"><p className="mb-2 text-xs font-semibold text-teal-800">A little connection to your mood</p><p className="line-clamp-3 text-xs leading-6 text-slate-600">{result.recommendationReason}</p></div>}
      <div className="flex-1" />
      <Link href={`/emobooks/books/${book.id}`} className="mt-5 flex items-center justify-between border-t border-[#e8ebe2] pt-4 text-xs font-semibold text-teal-800">Explore this story <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf2e9] transition-colors group-hover:bg-[#193f35] group-hover:text-white"><ArrowUpRight size={16} /></span></Link>
    </div>
  </article>;
}
