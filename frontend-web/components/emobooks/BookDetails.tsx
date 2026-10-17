"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { emotionLabel } from "@/lib/emobooks/data";
import { getRecommendations } from "@/lib/emobooks/recommendations";
import type { Book, RecommendationResult } from "@/lib/emobooks/types";
import { BookCover, SaveButton } from "./BookCard";
import { useEmoBooks } from "./EmoBooksProvider";

export default function BookDetails({ book }: { book: Book }) {
  const { request, ready } = useEmoBooks();
  const [match, setMatch] = useState<RecommendationResult | null>(null);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    if (ready) getRecommendations(request, controller.signal).then((results) => { if (!cancelled) setMatch(results.find((result) => result.id === book.id) ?? null); }).catch(() => { if (!cancelled) setMatch(null); });
    return () => { cancelled = true; controller.abort(); };
  }, [request, ready, book.id]);
  return <>
    <div className="mb-7 flex flex-wrap gap-5 text-sm font-semibold text-teal-800"><Link href="/emobooks/recommendations" className="inline-flex items-center gap-2"><ArrowLeft size={16} /> Back to recommendations</Link><Link href="/emobooks/saved">My saved books</Link></div>
    <article className="emo-panel grid gap-8 p-6 sm:p-10 lg:grid-cols-[320px_1fr] lg:gap-12">
      <BookCover book={book} large />
      <div><p className="emo-eyebrow">A story worth exploring</p><h1 className="mt-4 text-3xl font-semibold leading-relaxed sm:text-4xl">{book.title}</h1><p className="mt-3 text-base text-slate-500">by {book.author}</p><div className="my-6 flex flex-wrap gap-2">{book.genres.map((genre) => <span key={genre} className="rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">{genre}</span>)}</div><SaveButton book={book} full />
        <section className="mt-8 border-t border-slate-100 pt-7"><h2 className="text-lg font-semibold">Between the pages</h2><p className="mt-3 text-sm leading-8 text-slate-600">{book.description}</p></section>
        <section className="mt-7 rounded-2xl bg-[#f1f7ef] p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-teal-800"><Sparkles size={17} />{match ? "Why it is on your reading list" : "The feeling of this story"}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{match ? match.recommendationReason : `Story emotion: ${book.emotions.map(emotionLabel).join(", ")}. Choose your emotion and preferences to see whether this book appears in your reading list.`}</p>{match && <p className="mt-3 text-xs font-semibold text-teal-800">Relevance: {match.finalScore.toFixed(1)}/100</p>}</section>
        <p className="mt-6 text-xs leading-6 text-slate-400">Story emotion describes the book text. A relevance score orders suggestions and does not predict how you will feel.</p>
      </div>
    </article>
  </>;
}
