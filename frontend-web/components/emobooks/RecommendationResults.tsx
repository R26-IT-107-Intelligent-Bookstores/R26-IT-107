"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { emotionLabel, getTarget } from "@/lib/emobooks/data";
import { getRecommendations } from "@/lib/emobooks/recommendations";
import type { RecommendationResult } from "@/lib/emobooks/types";
import BookCard from "./BookCard";
import { useEmoBooks } from "./EmoBooksProvider";

export default function RecommendationResults() {
  const { request, ready, catalogRevision } = useEmoBooks();
  const [state, setState] = useState<{ status: "loading" | "success" | "error"; results: RecommendationResult[]; message?: string }>({ status: "loading", results: [] });
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("match");
  const target = getTarget(request);
  const genres = [...new Set(state.results.flatMap((book) => book.genres))].sort();
  useEffect(() => {
    if (!ready || !request.currentEmotion || !getTarget(request)) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: "loading", results: [] });
      getRecommendations(request, controller.signal).then((results) => { if (!cancelled) setState({ status: "success", results }); }).catch((error: unknown) => { if (!cancelled) setState({ status: "error", results: [], message: error instanceof Error ? error.message : "We could not load your suggestions. Please try again." }); });
    }, 350);
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [request, ready, retry, catalogRevision]);
  const filtered = state.results.filter((book) => `${book.title} ${book.author} ${book.genres.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()) && (!genre || book.genres.includes(genre))).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : b.finalScore - a.finalScore);
  if (ready && (!request.currentEmotion || !target)) return <div className="emo-panel mx-auto max-w-xl p-10 text-center"><HeartEmpty /><h1 className="text-2xl font-semibold">Start with a little check-in.</h1><p className="my-5 text-sm leading-7 text-slate-500">Choose your current emotion and goal so we can put together your reading suggestions.</p><Link href="/emobooks/discover" className="emo-primary">Choose my mood <ArrowRight size={17} /></Link></div>;
  return <>
    <div className="emo-panel flex flex-wrap items-end justify-between gap-6 bg-[#eef2e7] p-6 sm:p-9"><div><p className="emo-eyebrow">A new chapter, chosen by you</p><h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-5xl">Your next chapter <span className="font-serif italic text-teal-700">awaits.</span></h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Books matching your <strong className="text-teal-800">{emotionLabel(target)}</strong> goal.{request.genres.length ? ` Your interest in ${request.genres.join(" / ")} helps order these suggestions.` : ""} Explore at your own pace.</p></div><Link href="/emobooks/discover" className="emo-secondary"><SlidersHorizontal size={16} /> Edit my choices</Link></div>
    <div className="my-7 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-teal-800">Feeling: {emotionLabel(request.currentEmotion)}</span><span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-teal-800">{request.goalMode === "change" ? "Explore" : "Continue"}: {emotionLabel(target)}</span><span className="rounded-full bg-amber-50 px-3 py-2 text-amber-800">Selected from the book catalog</span></div>
    <div className="emo-panel mb-8 flex flex-wrap items-center gap-4 p-4"><div className="relative min-w-48 flex-1"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><label htmlFor="emo-search" className="sr-only">Search recommendations by title, author or genre</label><input id="emo-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author or genre…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm" /></div><div><label htmlFor="emo-genre" className="sr-only">Filter by genre</label><select id="emo-genre" value={genre} onChange={(event) => setGenre(event.target.value)} className="max-w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600"><option value="">All genres</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></div><div><label htmlFor="emo-sort" className="sr-only">Sort recommendations</label><select id="emo-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600"><option value="match">Relevance: highest first</option><option value="title">Title: A to Z</option></select></div></div>
    {state.status === "loading" || !ready ? <div role="status" aria-label="Finding your recommendations"><p className="mb-5 text-sm text-slate-500">Turning your choices into a reading list…</p><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="emo-panel animate-pulse p-4"><div className="h-72 rounded-xl bg-slate-100" /><div className="mt-6 h-5 w-3/4 rounded bg-slate-100" /><div className="mt-3 h-3 w-1/2 rounded bg-slate-100" /><div className="mt-6 h-20 rounded bg-slate-100" /></div>)}</div></div> : state.status === "error" ? <div role="alert" className="emo-panel p-10 text-center"><h2 className="text-xl font-semibold">Your reading list needs another try.</h2><p className="my-4 text-sm text-slate-500">{state.message}</p><button type="button" onClick={() => { setState({ status: "loading", results: [] }); setRetry((previous) => previous + 1); }} className="emo-primary"><RotateCcw size={16} /> Try again</button></div> : <>
      <p role="status" className="mb-5 text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? "story" : "stories"} to explore</p>
      {filtered.length ? <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((result) => <BookCard key={result.id} book={result} result={result} />)}</div> : <div className="emo-panel p-10 text-center"><HeartEmpty /><h2 className="text-2xl font-semibold">A different path to your next book.</h2><p className="mx-auto my-4 max-w-md text-sm leading-7 text-slate-500">{state.results.length ? "No books match these search filters. Try another title or genre." : "There are no available books for this emotional goal yet. Try a different goal or return as new stories join the catalog."}</p>{state.results.length ? <button type="button" onClick={() => { setQuery(""); setGenre(""); }} className="emo-secondary">Clear search filters</button> : <Link href="/emobooks/discover" className="emo-primary">Adjust my choices <ArrowRight size={17} /></Link>}</div>}
    </>}
  </>;
}

function HeartEmpty() { return <BookOpen size={40} className="mx-auto mb-5 text-teal-500" />; }
