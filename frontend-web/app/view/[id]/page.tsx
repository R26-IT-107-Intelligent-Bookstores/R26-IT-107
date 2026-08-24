"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, Sparkles, BookOpen, Bell, ShoppingCart, User } from "lucide-react";
import Link from "next/link";

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
  const price = searchParams?.get('price') || "0.00";

  const [loggedUser, setLoggedUser] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setLoggedUser(user);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    setLoggedUser(null);
    window.location.href = "/"; 
  };

  const handleConfirmOrder = () => {
    router.push(`/payment?title=${encodeURIComponent(bookId)}&price=${price}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col justify-start pb-12">
      
      {/* 🟢 Homepage එකේ තිබුණු සුදු පාට Navbar එක */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md flex items-center justify-between px-8 md:px-16 lg:px-24 py-4 border-b border-gray-200 shadow-sm transition-all">
        <Link href="/" className="flex items-center gap-2.5 text-teal-800 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="bg-teal-800 p-2 rounded-lg shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight">Intelligent Bookstore</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm md:text-base font-semibold text-gray-600">
          <Link href="/" className="hover:text-teal-700 transition-colors pb-0.5">Discover</Link>
          <Link href="#" className="hover:text-teal-700 transition-colors pb-0.5">Categories</Link>
          <Link href="#" className="hover:text-teal-700 transition-colors pb-0.5">Community</Link>
          <Link href="/trendstock" className="hover:text-teal-700 transition-colors pb-0.5">Trendstock</Link>
          <Link href="http://172.104.167.123:8765/" className="hover:text-teal-700 transition-colors pb-0.5">EmoBooks</Link>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:text-teal-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-teal-600 text-white text-[9px] flex items-center justify-center rounded-full font-bold">3</span>
          </button>
          <button className="relative p-2 text-gray-600 hover:text-teal-700 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-teal-600 text-white text-[9px] flex items-center justify-center rounded-full font-bold">2</span>
          </button>
          
          {loggedUser ? (
            <div className="flex items-center gap-3 ml-2">
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Hi, {loggedUser}
              </span>
              <button onClick={handleLogout} className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors shadow-sm cursor-pointer">
                Log Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors shadow-sm inline-block cursor-pointer ml-2">
              Sign In
            </Link>
          )}
        </div>
      </nav>

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