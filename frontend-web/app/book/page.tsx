import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";
import { featuredBooks } from "@/lib/bookData";

export default function BookDetailsIndexPage() {
  return (
    <>
      <MainNavbar />
      <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900 md:px-16 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Sparkles className="h-4 w-4" /> Intelligent recommendations
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Book Details</h1>
            <p className="mt-4 text-base leading-7 text-gray-500">Browse our featured collection and select any title for its full story, price, and intelligent bookstore features.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {featuredBooks.map((book) => (
              <Link key={book.id} href={`/book/${book.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-72 overflow-hidden bg-gray-100">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-teal-700 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-md">{book.match}</span>
                  <img src={book.cover} alt={book.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-teal-700">{book.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{book.author}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="font-bold text-teal-800">{book.price}</span>
                    <span aria-label={`View details for ${book.title}`} className="rounded-full bg-teal-50 p-2 text-teal-700">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-5 text-sm text-teal-900/75">
            <BookOpen className="h-5 w-5 shrink-0 text-teal-700" />
            <p>Use voice search and personalised recommendations to discover your next favourite book.</p>
          </div>
        </div>
      </main>
    </>
  );
}
