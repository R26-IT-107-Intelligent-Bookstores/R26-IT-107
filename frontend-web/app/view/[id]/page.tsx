"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, Sparkles, BookOpen, Star } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";
import { fetchFedBookReviews, fetchFedBookDetails } from "@/lib/fedBookApi";

const relatedBooks = [
  { title: "Madol Doova", price: "Rs. 1,250.00", cover: "from-emerald-400 to-teal-700" },
  { title: "Guru Geethaya", price: "Rs. 1,100.00", cover: "from-teal-400 to-cyan-700" },
  { title: "Gamperaliya", price: "Rs. 1,350.00", cover: "from-green-400 to-emerald-700" },
];

type FedBookReview = {
  id: string;
  content: string;
  rating: number;
  published: string;
  likeCount: number;
  author: { id?: string; username: string; displayName?: string; avatarUrl?: string | null };
};
type PlatformReception = {
  platform: string;
  positive: number;
  neutral: number;
  negative: number;
  mentions: number;
  positivePct: number | null;
  starRating: number | null;
};
type FedBookDetails = {
  isbn: string;
  reception: { platforms: PlatformReception[]; overallPositivePct: number | null; totalMentions: number } | null;
  hardcover: { rating: number; ratingsCount?: number; reviewsCount?: number } | null;
  platform: { rating: number; count: number } | null;
};

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  youtube:  { label: "YouTube",  color: "#ff0000" },
  bluesky:  { label: "Bluesky",  color: "#0085ff" },
  mastodon: { label: "Mastodon", color: "#6364ff" },
};
const PLATFORM_ORDER = ["youtube", "bluesky", "mastodon"];

function pct(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

export default function BookDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookId = params?.id ? decodeURIComponent(params.id as string) : "";

  // කලින් පිටුවෙන් එවපු පින්තූරය සහ විස්තර අල්ලගැනීම
  const image = searchParams?.get('image') || "";
  const author = searchParams?.get('author') || "නොදනී (Unknown)";
  const isbn = searchParams?.get('isbn') || "Not available";
  const price = searchParams?.get('price') || "0.00";

  const [reviews, setReviews] = useState<FedBookReview[]>([]);
  const [details, setDetails] = useState<FedBookDetails | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  useEffect(() => {
    // The URL segment on /view/:id might be the ISBN itself, or the search-param `isbn` was passed.
    // Prefer the query-param when present; fall back to the URL segment.
    const isbnCandidate = (isbn && isbn !== "Not available") ? isbn : bookId;
    if (!isbnCandidate) { setReviewsLoading(false); return; }
    let cancelled = false;
    setReviewsLoading(true);
    Promise.all([
      fetchFedBookReviews(isbnCandidate),
      fetchFedBookDetails(isbnCandidate),
    ]).then(([r, d]) => {
      if (cancelled) return;
      setReviews(r as FedBookReview[]);
      setDetails(d as FedBookDetails | null);
      setReviewsLoading(false);
    });
    return () => { cancelled = true; };
  }, [isbn, bookId]);

  const handleConfirmOrder = () => {
    router.push(`/payment?title=${encodeURIComponent(bookId)}&price=${price}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col justify-start pb-12">
      
      <MainNavbar />

      <div className="py-6 px-6 md:px-16 lg:px-24">
        
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* 🟢 පින්තූරය පෙන්නන තැන */}
            <div className="h-80 md:h-96 rounded-2xl bg-gray-100 flex items-center justify-center text-white shadow-inner overflow-hidden relative">
              {image ? (
                <img src={image} alt={bookId} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
                  <span className="text-8xl">📖</span>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Verified Novelty
                  </span>
                </div>
                
                {/* නම සහ කර්තෘ */}
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{bookId}</h1>
                <p className="text-gray-500 text-base mb-4">කර්තෘ: <span className="font-semibold text-gray-800">{author}</span></p>
                <p className="text-gray-500 text-sm mb-4">ISBN: <span className="font-semibold text-gray-800">{isbn}</span></p>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  සිංහල සාහිත්‍යයේ අග්‍රගන්‍ය නවකතාවක් වන මෙය සංස්කෘතික හා සමාජීය පසුබිම මනාව විදහා දක්වයි. Intelligent Bookstore AI හරහා හඳුනාගත් තොරතුරු.
                </p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">මිල:</span>
                  <span className="text-3xl font-black text-teal-800">Rs. {parseFloat(price).toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm Action */}
              <button 
                onClick={handleConfirmOrder}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-lg hover:shadow-lg active:scale-98"
              >
                <ShoppingBag className="w-5 h-5" /> ඇණවුම තහවුරු කරන්න (Confirm Order)
              </button>
            </div>

          </div>
        </div>

        {/* ============ Reviews from around the web (FedBook + YT + Bluesky + Mastodon) ============ */}
        <section className="max-w-4xl mx-auto mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Reader voices</p>
            <h2 className="text-2xl font-extrabold text-gray-900">Reviews from around the web</h2>
          </div>

          {(() => {
            const platform = details?.platform ?? null;
            const hardcover = details?.hardcover ?? null;
            const reception = details?.reception ?? null;
            const byPlatform: Record<string, PlatformReception> = Object.fromEntries(
              (reception?.platforms ?? []).map((p) => [p.platform, p])
            );
            const platformRows: PlatformReception[] = PLATFORM_ORDER.map((key) => (
              byPlatform[key] ?? { platform: key, positive: 0, neutral: 0, negative: 0, mentions: 0, positivePct: null, starRating: null }
            ));
            const totalMentions = reception?.totalMentions ?? 0;
            return (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <h3 className="font-serif text-lg font-bold text-gray-900">Reviews from around the web</h3>
                  {platform && platform.count > 0 && (
                    <span
                      title={`Average of ${platform.count.toLocaleString()} FedBook reader rating${platform.count === 1 ? "" : "s"} on this book.`}
                      className="inline-flex items-center gap-1 rounded-full border border-teal-700/25 bg-teal-700/10 px-2.5 py-1 text-sm text-gray-800"
                    >
                      <span className="text-teal-700">★</span>
                      <b>{platform.rating.toFixed(1)}</b>
                      <span className="text-xs font-normal text-gray-500">/5 FedBook ({platform.count.toLocaleString()})</span>
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <span className="border-b border-dotted border-gray-400">
                      <b className="text-gray-800">{reception ? pct(reception.overallPositivePct) : "—"}</b> positive
                    </span>
                    <span>·</span>
                    <span className="border-b border-dotted border-gray-400">
                      {totalMentions.toLocaleString()} mentions across YouTube, Bluesky &amp; Mastodon
                    </span>
                  </div>
                  {hardcover && hardcover.rating != null && (
                    <div
                      title="Live star rating from Hardcover.app."
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-sm"
                    >
                      <span className="text-amber-500">★</span>
                      <b>{hardcover.rating.toFixed(1)}</b>
                      <span className="text-xs font-normal text-gray-500">
                        /5{hardcover.ratingsCount ? ` (${hardcover.ratingsCount.toLocaleString()})` : ""}
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid gap-2.5">
                  {platformRows.map((p) => {
                    const meta = PLATFORM_META[p.platform] || { label: p.platform, color: "#888" };
                    const total = p.positive + p.neutral + p.negative;
                    const empty = total === 0;
                    const posW = empty ? 0 : (p.positive / total) * 100;
                    const neuW = empty ? 0 : (p.neutral  / total) * 100;
                    const negW = empty ? 0 : (p.negative / total) * 100;
                    return (
                      <div
                        key={p.platform}
                        className="grid items-center gap-3"
                        style={{ gridTemplateColumns: "90px 1fr auto", opacity: empty ? 0.55 : 1 }}
                      >
                        <span className="text-sm font-semibold border-b border-dotted" style={{ color: meta.color, borderColor: meta.color }}>
                          {meta.label}
                        </span>
                        <div className="flex h-2 overflow-hidden rounded" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div style={{ width: `${posW}%`, background: "#4caf50" }} />
                          <div style={{ width: `${neuW}%`, background: "#7d7d7d" }} />
                          <div style={{ width: `${negW}%`, background: "#e64a4a" }} />
                        </div>
                        <span className="min-w-[160px] whitespace-nowrap text-right text-xs text-gray-500">
                          {empty ? (
                            "0/0 reviews"
                          ) : (
                            <>
                              {pct(p.positivePct)} · {p.mentions} review{p.mentions === 1 ? "" : "s"}
                              {p.starRating != null && (
                                <span className="ml-2 text-[#4b9dff]">
                                  ★ <b className="text-gray-800">{p.starRating.toFixed(1)}</b>
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Individual FedBook reviews (2 placeholder cards while empty) */}
          <div className="mt-6 mb-2 flex items-baseline justify-between gap-4">
            <h3 className="font-serif text-lg font-bold text-gray-900">Community reviews on FedBook</h3>
            <span className="text-sm font-semibold text-gray-500">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((i) => (
                <article
                  key={`placeholder-${i}`}
                  className="flex flex-col rounded-2xl border border-dashed border-gray-200 bg-white p-5 shadow-sm opacity-70"
                  aria-hidden="true"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-400">?</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-400">Reader name</p>
                      <p className="text-xs text-gray-400">@username · —</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-400">
                      <Star className="h-3.5 w-3.5 stroke-gray-400" /> 0.0
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-400">
                    {reviewsLoading ? "Loading reviews from FedBook…" : "No FedBook reviews yet — reviews from readers will appear here once they're shared."}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-gray-300">♥ 0 likes</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => {
                const initial = (review.author.displayName || review.author.username || "?").charAt(0).toUpperCase();
                const publishedDate = (() => {
                  try { return new Date(review.published).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
                  catch { return ""; }
                })();
                return (
                  <article key={review.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      {review.author.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.author.avatarUrl} alt={review.author.displayName || review.author.username} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-800">{initial}</div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{review.author.displayName || review.author.username}</p>
                        <p className="text-xs text-gray-500">@{review.author.username}{publishedDate ? ` · ${publishedDate}` : ""}</p>
                      </div>
                      {review.rating > 0 && (
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                          {review.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{review.content}</p>
                    {review.likeCount > 0 && (
                      <p className="mt-3 text-xs font-semibold text-gray-400">
                        ♥ {review.likeCount} {review.likeCount === 1 ? "like" : "likes"}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="max-w-4xl mx-auto mt-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">More to explore</p>
              <h2 className="text-2xl font-extrabold text-gray-900">Related Books</h2>
            </div>
            <span className="hidden sm:block text-sm text-gray-400">Curated for your reading list</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedBooks.map((book) => (
              <article key={book.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-40 bg-gradient-to-br ${book.cover} flex items-center justify-center`}>
                  <BookOpen className="w-14 h-14 text-white/80" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900">{book.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-teal-800">{book.price}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}