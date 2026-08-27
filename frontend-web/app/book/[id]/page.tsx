"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Headphones, Search, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { featuredBooks, getFeaturedBook } from "@/lib/bookData";

export default function BookDetailsPage() {
  const params = useParams<{ id: string }>();
  const book = getFeaturedBook(params.id);

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

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-600">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
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
              <p className="mt-8 max-w-2xl text-base leading-7 text-gray-600">{book.description}</p>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-y border-gray-100 py-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Price</p>
                  <p className="mt-1 text-3xl font-black text-teal-800">{book.price}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-700">{book.match}</span>
              </div>

              <button className="mt-8 w-full rounded-full bg-teal-700 px-6 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-teal-800 md:w-fit">
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
  );
}
