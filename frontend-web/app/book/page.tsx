"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";
import PhonoLexSearch from "@/components/PhonoLexSearch";
import { getApiUrl } from "@/lib/apiConfig";
import { featuredBooks } from "@/lib/bookData";

type DatabaseBook = {
  id?: string;
  _id?: string;
  title?: string;
  author?: string;
  isbn?: string;
  price?: number | string;
  cover_image_url?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  cover?: string;
  description?: string;
};

const getCover = (book: DatabaseBook) => book.cover_image_url || book.coverImageUrl || book.coverUrl || book.cover || "";

const getBookId = (book: DatabaseBook) => book.id || book._id || book.isbn || book.title || "book";

const normalize = (value?: string) => value?.trim().toLowerCase() || "";

const getBookKeys = (book: DatabaseBook) => [
  normalize(book.id),
  normalize(book._id),
  normalize(book.isbn),
  normalize(book.title),
].filter(Boolean);

const getPrice = (price: DatabaseBook["price"]) => {
  if (typeof price === "number") return price.toFixed(2);
  return price ? String(price).replace(/^Rs\.\s*/, "") : "0.00";
};

export default function BookDetailsIndexPage() {
  const [books, setBooks] = useState<DatabaseBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/books`);
        if (!response.ok) throw new Error("Books request failed");
        const data = await response.json();
        const fetchedBooks = Array.isArray(data) ? data : data.books || data.results || [];
        const pinnedBooks: DatabaseBook[] = featuredBooks.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          price: book.price,
          cover: book.cover,
        }));
        const pinnedKeys = new Set(pinnedBooks.flatMap(getBookKeys));
        const remainingBooks = fetchedBooks
          .filter((book: DatabaseBook) => !getBookKeys(book).some((key) => pinnedKeys.has(key)))
          .sort((firstBook: DatabaseBook, secondBook: DatabaseBook) =>
            Number(Boolean(getCover(secondBook))) - Number(Boolean(getCover(firstBook)))
          );

        setBooks([...pinnedBooks, ...remainingBooks]);
      } catch (fetchError) {
        console.error("Failed to load books:", fetchError);
        setError("Unable to load books right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, []);

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

          <div className="mb-8 flex w-full justify-center">
            <PhonoLexSearch compact />
          </div>

          {isLoading && <p className="py-16 text-center text-gray-500">Loading books...</p>}
          {error && <p className="py-16 text-center text-red-600">{error}</p>}
          {!isLoading && !error && books.length === 0 && <p className="py-16 text-center text-gray-500">No books are available.</p>}

          {!isLoading && !error && books.length > 0 && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {books.map((book) => {
              const bookId = getBookId(book);
              const cover = getCover(book);
              return (
              <Link key={String(bookId)} href={`/view/${encodeURIComponent(String(bookId))}?image=${encodeURIComponent(cover)}&title=${encodeURIComponent(book.title || "")}&author=${encodeURIComponent(book.author || "")}&isbn=${encodeURIComponent(book.isbn || "")}&price=${encodeURIComponent(getPrice(book.price))}`} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-72 overflow-hidden bg-gray-100">
                  {cover ? <img src={cover} alt={book.title || "Book cover"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-teal-50"><BookOpen className="h-14 w-14 text-teal-300" /></div>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-teal-700">{book.title || "Untitled book"}</h2>
                  <p className="mt-1 text-sm text-gray-500">{book.author || "Unknown author"}</p>
                  <p className="mt-2 text-xs font-medium text-gray-400">ISBN: {book.isbn || "Not available"}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="font-bold text-teal-800">Rs. {getPrice(book.price)}</span>
                    <span aria-label={`View details for ${book.title || "book"}`} className="rounded-full bg-teal-50 p-2 text-teal-700">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>}

          <div className="mt-12 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-5 text-sm text-teal-900/75">
            <BookOpen className="h-5 w-5 shrink-0 text-teal-700" />
            <p>Use voice search and personalised recommendations to discover your next favourite book.</p>
          </div>
        </div>
      </main>
    </>
  );
}
