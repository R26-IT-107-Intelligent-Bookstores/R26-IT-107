"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, Sparkles, BookOpen } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";

const relatedBooks = [
  { title: "Madol Doova", price: "Rs. 1,250.00", cover: "from-emerald-400 to-teal-700" },
  { title: "Guru Geethaya", price: "Rs. 1,100.00", cover: "from-teal-400 to-cyan-700" },
  { title: "Gamperaliya", price: "Rs. 1,350.00", cover: "from-green-400 to-emerald-700" },
];

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