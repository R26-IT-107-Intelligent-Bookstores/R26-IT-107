"use client";

import Link from "next/link";
import { BookOpen, Headphones, Search, Sparkles, Star } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { featuredBooks, getFeaturedBook } from "@/lib/bookData";
import { fetchFedBookReviews, fetchFedBookDetails, postFedBookReview } from "@/lib/fedBookApi";
import MainNavbar from "@/components/MainNavbar";

type FedBookReview = {
  id: string;
  content: string;
  rating: number;
  published: string;
  likeCount: number;
  author: {
    id?: string;
    username: string;
    displayName?: string;
    avatarUrl?: string | null;
  };
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

// Three social-platform brand identities we surface on every book, in this
// order. Colours + tooltip copy match the FedBook ReceptionBadges component 1:1.
const PLATFORM_META: Record<string, { label: string; color: string; tip: string }> = {
  youtube: {
    label: "YouTube", color: "#ff0000",
    tip: "Public top-level comments on YouTube review videos matching this book title and author. Fetched via the YouTube Data API v3.",
  },
  bluesky: {
    label: "Bluesky", color: "#0085ff",
    tip: "Public posts on Bluesky matching this book title and author. Fetched via Bluesky's searchPosts API (AT Protocol).",
  },
  mastodon: {
    label: "Mastodon", color: "#6364ff",
    tip: "Public posts on Mastodon tagged with #bookstodon, #booksky, #booktok or #bookreview across federated instances.",
  },
};
const PLATFORM_ORDER = ["youtube", "bluesky", "mastodon"];

const TIP = {
  header: "Aggregate reception signal for this book. Each platform is scraped periodically, mentions are sentiment-scored, and only aggregate counts are stored — raw text is never persisted.",
  overall: "Weighted mean of each platform's positive %. Weights: YouTube 40%, Bluesky 30%, Mastodon 30%. Platforms with no mentions for this book are skipped.",
  mentions: "Total number of public posts / comments scored across all platforms, summed. Each mention is one scraped post or comment.",
  hardcover: "Live star rating from Hardcover.app — an alternative to Goodreads. Fetched fresh from their GraphQL API every page load. Rating is Hardcover's aggregate of every star their users have given this ISBN.",
  bar: "Green = positive, grey = neutral, red = negative. Sentiment is labelled per-mention by a language model (CardiffNLP twitter-roberta), then aggregated into these counts.",
  platformStars: "Per-platform star rating: ★ = ((positive + 0.5 × neutral) / total) × 5. A 100%-positive platform gives 5 stars, 100%-neutral gives 2.5, 100%-negative gives 0.",
  fedbookPill: "Average rating from FedBook readers who left a rated review on this ISBN.",
  reviewStar: "The reader's own 1-5 star rating on this review.",
};

function pct(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

function InfoDot({ tip }: { tip: string }) {
  return (
    <span
      title={tip}
      aria-label="Info"
      role="img"
      className="ml-1.5 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-gray-400 text-[9px] font-bold leading-none text-gray-400 opacity-70"
    >
      i
    </span>
  );
}

export default function BookDetailsPage() {
  const params = useParams<{ id: string }>();
  const book = getFeaturedBook(params.id);
  const [reviews, setReviews] = useState<FedBookReview[]>([]);
  const [details, setDetails] = useState<FedBookDetails | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  // Write-review form state (mirrors /view/[id] behaviour: auto-provisions
  // the FedBook user on first submit via /api/auth/sso, then POST /api/reviews).
  const [formUsername, setFormUsername] = useState<string>("");
  const [formDisplayName, setFormDisplayName] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [formRating, setFormRating] = useState<number>(5);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");

  useEffect(() => {
    // Prefill from Intelligent Bookstore's session for one-click submit.
    if (typeof window === "undefined") return;
    const ibUser = localStorage.getItem("username");
    if (ibUser) {
      setFormUsername(ibUser);
      setFormDisplayName(ibUser);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    if (!book?.isbn) { setReviewsLoading(false); return; }
    setReviewsLoading(true);
    const [r, d] = await Promise.all([
      fetchFedBookReviews(book.isbn),
      fetchFedBookDetails(book.isbn),
    ]);
    setReviews(r as FedBookReview[]);
    setDetails(d as FedBookDetails | null);
    setReviewsLoading(false);
  }, [book?.isbn]);

  useEffect(() => {
    let cancelled = false;
    loadReviews().catch(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [loadReviews]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!book?.isbn) {
      setFormError("Cannot post a review without a valid ISBN.");
      return;
    }
    const cleaned = formUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(cleaned)) {
      setFormError("Username must be 3-30 characters (letters, digits, underscore).");
      return;
    }
    setSubmitting(true);
    try {
      await postFedBookReview({
        isbn: book.isbn,
        content: formContent,
        rating: formRating,
        username: cleaned,
        displayName: formDisplayName.trim() || cleaned,
      });
      setFormSuccess("Thanks for your review!");
      setFormContent("");
      setFormRating(5);
      await loadReviews();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit your review.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!book) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-teal-700" />
        <h1 className="text-3xl font-bold text-gray-900">Book not found</h1>
        <p className="mt-2 text-gray-500">This title is not currently available in the bookstore.</p>
        <Link href="/" className="mt-6 rounded-full bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800">
          Back to Discover
        </Link>
      </main>
    );
  }

  const relatedBooks = featuredBooks.filter((relatedBook) => relatedBook.id !== book.id).slice(0, 3);
  const paymentPrice = book.price.replace("Rs. ", "");

  return (
    <>
      <MainNavbar />
      <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-8 inline-flex items-center text-sm font-semibold text-teal-800 hover:text-teal-600">
          Back to Discover
        </Link>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-10 p-6 md:grid-cols-[minmax(260px,360px)_1fr] md:p-10 lg:gap-16">
            <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
              <img src={book.cover} alt={`Cover of ${book.title}`} className="h-full max-h-[520px] w-full object-cover" />
            </div>

            <div className="flex flex-col justify-center">
              <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-teal-800">
                <Sparkles className="h-3.5 w-3.5" /> Intelligent recommendation
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">{book.title}</h1>
              <p className="mt-3 text-lg font-medium text-gray-500">by {book.author}</p>
              <p className="mt-2 text-sm font-semibold tracking-wide text-gray-400">ISBN: {book.isbn}</p>
              <p className="mt-8 max-w-2xl text-base leading-7 text-gray-600">{book.description}</p>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-y border-gray-100 py-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Price</p>
                  <p className="mt-1 text-3xl font-black text-teal-800">{book.price}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-700">{book.match}</span>
              </div>

              <button
                onClick={() => window.location.assign(`/payment?title=${encodeURIComponent(book.title)}&price=${encodeURIComponent(paymentPrice)}`)}
                className="mt-8 w-full rounded-full bg-teal-700 px-6 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-teal-800 md:w-fit"
              >
                Reserve this book
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Built for curious readers</p>
            <h2 className="mt-1 text-2xl font-extrabold">Intelligent bookstore features</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <Search className="h-6 w-6 text-teal-700" />
              <h3 className="mt-4 font-bold">Singlish search</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">Find the right story using natural voice and Singlish phrases.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <Sparkles className="h-6 w-6 text-teal-700" />
              <h3 className="mt-4 font-bold">Personalised matches</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">Recommendations shaped around your literary vibe and interests.</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <Headphones className="h-6 w-6 text-teal-700" />
              <h3 className="mt-4 font-bold">Explore by mood</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">Discover books through narrative style, emotion, and atmosphere.</p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Reader voices</p>
            <h2 className="mt-1 text-2xl font-extrabold">Reviews from around the web</h2>
          </div>

          {/* Summary card: FedBook rating chip + overall reception + Hardcover chip
              + 3 platform rows (YouTube / Bluesky / Mastodon), always rendered so
              you can see the shape even before backend data arrives. */}
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
                  <h3 className="inline-flex items-center font-serif text-lg font-bold text-gray-900">
                    Reviews from around the web
                    <InfoDot tip={TIP.header} />
                  </h3>

                  {platform && platform.count > 0 && (
                    <span
                      title={`${TIP.fedbookPill} Averaged across ${platform.count.toLocaleString()} reader rating${platform.count === 1 ? "" : "s"}.`}
                      className="inline-flex cursor-help items-center gap-1 rounded-full border border-teal-700/25 bg-teal-700/10 px-2.5 py-1 text-sm text-gray-800"
                    >
                      <span className="text-teal-700">★</span>
                      <b>{platform.rating.toFixed(1)}</b>
                      <span className="text-xs font-normal text-gray-500">
                        /5 FedBook ({platform.count.toLocaleString()})
                      </span>
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <span title={TIP.overall} className="cursor-help border-b border-dotted border-gray-400">
                      <b className="text-gray-800">{reception ? pct(reception.overallPositivePct) : "—"}</b> positive
                    </span>
                    <span>·</span>
                    <span title={TIP.mentions} className="cursor-help border-b border-dotted border-gray-400">
                      {totalMentions.toLocaleString()} mentions across YouTube, Bluesky &amp; Mastodon
                    </span>
                  </div>

                  {hardcover && hardcover.rating != null && (
                    <div
                      title={`${TIP.hardcover}${hardcover.ratingsCount ? ` — ${hardcover.ratingsCount.toLocaleString()} ratings${hardcover.reviewsCount ? `, ${hardcover.reviewsCount.toLocaleString()} written reviews` : ""}.` : "."}`}
                      className="ml-auto inline-flex cursor-help items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-sm"
                    >
                      <span className="text-amber-500">★</span>
                      <b>{hardcover.rating.toFixed(1)}</b>
                      <span className="text-xs font-normal text-gray-500">
                        /5{hardcover.ratingsCount ? ` (${hardcover.ratingsCount.toLocaleString()})` : ""}
                      </span>
                      <InfoDot tip={TIP.hardcover} />
                    </div>
                  )}
                </div>

                <div className="grid gap-2.5">
                  {platformRows.map((p) => {
                    const meta = PLATFORM_META[p.platform] || { label: p.platform, color: "#888", tip: "" };
                    const total = p.positive + p.neutral + p.negative;
                    const empty = total === 0;
                    const posW = empty ? 0 : (p.positive / total) * 100;
                    const neuW = empty ? 0 : (p.neutral  / total) * 100;
                    const negW = empty ? 0 : (p.negative / total) * 100;
                    const barTip = empty
                      ? `No reviews found for this book on ${meta.label}.`
                      : `${TIP.bar}\n\npositive: ${p.positive}\nneutral: ${p.neutral}\nnegative: ${p.negative}`;
                    const rightTip = empty
                      ? `No reviews found for this book on ${meta.label}.`
                      : `${p.positive} positive out of ${total} total mentions (positive + neutral + negative).`;
                    return (
                      <div
                        key={p.platform}
                        className="grid items-center gap-3"
                        style={{ gridTemplateColumns: "90px 1fr auto", opacity: empty ? 0.55 : 1 }}
                      >
                        <span
                          title={meta.tip}
                          className="cursor-help border-b border-dotted text-sm font-semibold"
                          style={{ color: meta.color, borderColor: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <div
                          title={barTip}
                          className="flex h-2 cursor-help overflow-hidden rounded"
                          style={{ background: "rgba(0,0,0,0.06)" }}
                        >
                          <div style={{ width: `${posW}%`, background: "#4caf50" }} />
                          <div style={{ width: `${neuW}%`, background: "#7d7d7d" }} />
                          <div style={{ width: `${negW}%`, background: "#e64a4a" }} />
                        </div>
                        <span
                          title={rightTip}
                          className="min-w-[160px] cursor-help whitespace-nowrap text-right text-xs text-gray-500"
                        >
                          {empty ? (
                            "0/0 reviews"
                          ) : (
                            <>
                              {pct(p.positivePct)} · {p.mentions} review{p.mentions === 1 ? "" : "s"}
                              {p.starRating != null && (
                                <span title={TIP.platformStars} className="ml-2 cursor-help text-[#4b9dff]">
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

          {/* Write-a-review form. Auto-provisions the FedBook user on first submit. */}
          <form onSubmit={handleReviewSubmit} className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-gray-900">Write your review</h3>
            <p className="mt-1 text-xs text-gray-500">
              First time here? We&apos;ll create your FedBook account when you submit — no password needed.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Username</span>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="your_handle"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  minLength={3}
                  maxLength={30}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Display name (optional)</span>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="How your name shows on reviews"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  maxLength={80}
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Your review</span>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Share your thoughts on this book…"
                rows={4}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                required
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormRating(n)}
                      aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                      className="p-0.5"
                    >
                      <Star
                        className={
                          "h-6 w-6 " +
                          (n <= formRating
                            ? "fill-amber-500 stroke-amber-500"
                            : "stroke-gray-300")
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-1 text-sm font-bold text-gray-700">{formRating.toFixed(1)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-teal-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Posting…" : "Post review"}
              </button>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {formSuccess}
              </p>
            )}
          </form>

          {/* Individual FedBook reviews (falls back to 2 placeholder cards). */}
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-400">
                      ?
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-400">Reader name</p>
                      <p className="text-xs text-gray-400">@username · —</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-400">
                      <Star className="h-3.5 w-3.5 stroke-gray-400" />
                      0.0
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-400">
                    {reviewsLoading
                      ? "Loading reviews from FedBook…"
                      : "No FedBook reviews yet — reviews from readers will appear here once they're shared."}
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-800">
                          {initial}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{review.author.displayName || review.author.username}</p>
                        <p className="text-xs text-gray-500">@{review.author.username}{publishedDate ? ` · ${publishedDate}` : ""}</p>
                      </div>
                      {review.rating > 0 && (
                        <div
                          title={TIP.reviewStar}
                          className="flex cursor-help items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
                        >
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

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">You may also enjoy</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {relatedBooks.map((relatedBook) => (
              <Link key={relatedBook.id} href={`/book/${relatedBook.id}`} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="h-44 bg-gray-100">
                  <img src={relatedBook.cover} alt={relatedBook.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold group-hover:text-teal-700">{relatedBook.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{relatedBook.author}</p>
                  <p className="mt-3 font-bold text-teal-800">{relatedBook.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
