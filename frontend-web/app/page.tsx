"use client"; 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, Mic, Bell, ShoppingCart, User, ChevronLeft, ChevronRight, TrendingUp, Flame, Heart, MessageCircle, Headphones, Users, BookMarked } from 'lucide-react';
import PhonoLexSearch from '@/components/PhonoLexSearch';

export default function HomePage() {
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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-gray-50/95 backdrop-blur-md flex items-center justify-between px-8 md:px-16 lg:px-24 py-4 border-b border-gray-200 shadow-sm transition-all">
        <div className="flex items-center gap-2.5 text-teal-800 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="bg-teal-800 p-2 rounded-lg shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight">Intelligent Bookstore</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm md:text-base font-semibold text-gray-600">
          <Link href="#" className="text-teal-800 font-bold border-b-2 border-teal-800 pb-0.5">Discover</Link>
          
          {/* Categories Dropdown */}
          <div className="relative group pb-0.5">
            <button className="text-gray-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors">
              Categories
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-md shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <Link href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium border-b border-gray-50">Mystery & Psychological</Link>
              <Link href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium border-b border-gray-50">Horror & Paranormal</Link>
              <Link href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium border-b border-gray-50">Romance & Drama</Link>
              <Link href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium">Educational & IT</Link>
            </div>
          </div>

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

      <main className="w-full px-8 md:px-16 lg:px-24 py-12">
        
        {/* Hero Section */}
        <div className="text-center max-w-6xl mx-auto mb-16 mt-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 text-gray-900 leading-tight">
            Discover Books with Your Voice
          </h1>
          <p className="text-base md:text-lg text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            Experience next-generation book discovery. Search in Singlish, explore by narrative style, and find your perfect literary match.
          </p>

          {/* Search Bar - Powered by PhonoLex-SL */}
          <div className="w-full max-w-3xl mx-auto mb-16 z-20 relative">
             <PhonoLexSearch />
          </div>

          {/* NEW: Wide Slideshow Section */}
          <div className="w-full max-w-5xl mx-auto mb-12 relative group">
            {/* Scrollable Container */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 pt-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
              
              {/* Slide 1: Weekend Sale */}
              <div className="snap-center shrink-0 w-full relative rounded-3xl overflow-hidden shadow-lg h-64 md:h-80 group/slide cursor-pointer">
                <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop" alt="Weekend Sale" className="w-full h-full object-cover group-hover/slide:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/95 via-teal-900/70 to-transparent flex items-center p-8 md:p-16 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">Limited Time</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Weekend Sale</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-teal-50">Get up to 50% off on all award-winning Sinhala translations.</p>
                    <button className="bg-white text-teal-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-teal-50 transition-colors shadow-sm">Shop Now</button>
                  </div>
                </div>
              </div>

              {/* Slide 2: AI Voice Search */}
              <div className="snap-center shrink-0 w-full relative rounded-3xl overflow-hidden shadow-lg h-64 md:h-80 group/slide cursor-pointer">
                <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop" alt="PhonoLex Voice Search" className="w-full h-full object-cover group-hover/slide:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-emerald-900/70 to-transparent flex items-center p-8 md:p-16 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">New Feature</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Just Say It!</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-emerald-50">Try our new PhonoLex Voice AI. Search for books using Singlish voice commands instantly.</p>
                    <button className="bg-white text-emerald-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm">Try Voice Search</button>
                  </div>
                </div>
              </div>

              {/* Slide 3: Emotion AI Recommendations */}
              <div className="snap-center shrink-0 w-full relative rounded-3xl overflow-hidden shadow-lg h-64 md:h-80 group/slide cursor-pointer">
                <img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop" alt="EmoBooks AI" className="w-full h-full object-cover group-hover/slide:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/70 to-transparent flex items-center p-8 md:p-16 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">EmoBooks AI</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Mood Matches</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-blue-50">Let our AI find the perfect book for your current mood. Explore emotion-based recommendations.</p>
                    <button className="bg-white text-blue-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm">Discover Moods</button>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Scroll Instructions */}
            <p className="text-gray-400 text-xs mt-3">Swipe or scroll horizontally to see more offers <ChevronRight className="inline w-3 h-3" /></p>
          </div>

          {/* Central Stats Bar */}
          <div className="bg-gray-100/70 border border-gray-200 rounded-full max-w-2xl mx-auto px-10 py-4 shadow-inner flex items-center justify-around text-gray-700">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-teal-600" />
              <div className='flex flex-col items-start'>
                <span className="font-extrabold text-xl">5k+</span>
                <span className="text-xs text-gray-500 font-medium">Audiobooks</span>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <BookMarked className="w-5 h-5 text-teal-600" />
              <div className='flex flex-col items-start'>
                <span className="font-extrabold text-xl">10k+</span>
                <span className="text-xs text-gray-500 font-medium">Singlish Titles</span>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-teal-600" />
              <div className='flex flex-col items-start'>
                <span className="font-extrabold text-xl">2.5k</span>
                <span className="text-xs text-gray-500 font-medium">Active Readers</span>
              </div>
            </div>
          </div>
        </div>

        {/* For You Section */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-teal-700 text-xl">✨</span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">For You</h2>
              </div>
              <p className="text-sm md:text-base text-gray-500">Based on your Literary Vibe & Cultural Ontology</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Book Card 1 */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col group cursor-pointer">
              <div className="relative h-72 bg-gray-100 overflow-hidden">
                <div className="absolute top-3 left-3 bg-teal-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full z-10 shadow-md">
                  92% Match
                </div>
                <img src="/images/books/senkottan.jpg" alt="සෙන්කොට්ටං" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">සෙන්කොට්ටං</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">මහින්ද ප්‍රසාද් මස්ඉඹුල</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 850.00</span>
                  </div>
                  <button className="text-[11px] md:text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 font-semibold text-gray-700 transition-all">
                    Reserve
                  </button>
                </div>
              </div>
            </div>

            {/* Book Card 2 */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col group cursor-pointer">
              <div className="relative h-72 bg-gray-100 overflow-hidden">
                <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full z-10 shadow-md">
                  88% Match
                </div>
                <img src="/guru-geethaya.png" alt="ගුරු ගීතය" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">ගුරු ගීතය</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">චිංගීස් අයිත්මාතව්</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 650.00</span>
                  </div>
                  <button className="text-[11px] md:text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 font-semibold text-gray-700 transition-all">
                    Reserve
                  </button>
                </div>
              </div>
            </div>

            {/* Book Card 3 */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col group cursor-pointer">
              <div className="relative h-72 bg-gray-100 overflow-hidden">
                <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full z-10 shadow-md">
                  85% Match
                </div>
                <img src="/MadolDoova.jpg" alt="මඩොල් දූව" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">මඩොල් දූව</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">මාර්ටින් වික්‍රමසිංහ</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 450.00</span>
                  </div>
                  <button className="text-[11px] md:text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 font-semibold text-gray-700 transition-all">
                    Reserve
                  </button>
                </div>
              </div>
            </div>
            
             {/* Book Card 4 */}
             <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col group cursor-pointer">
              <div className="relative h-72 bg-gray-100 overflow-hidden">
                <div className="absolute top-3 left-3 bg-teal-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full z-10 shadow-md">
                  82% Match
                </div>
                <img src="/MV5BZGE0ZTgyM2YtNzZjNy00MTE0LTlhYzItYmE5ZWMwYzZjOWU3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg" alt="අලිමංකඩ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">අලිමංකඩ</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">නිහාල් ද සිල්වා</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 950.00</span>
                  </div>
                  <button className="text-[11px] md:text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 font-semibold text-gray-700 transition-all">
                    Reserve
                  </button>
                </div>
              </div>
            </div>
            
            {/* Book Card 5 */}
            <div className="hidden xl:flex border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex-col group cursor-pointer">
              <div className="relative h-72 bg-gray-100 overflow-hidden">
                <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full z-10 shadow-md">
                  80% Match
                </div>
                <img src="/images/books/amba_yahaluwo_new.jpg" alt="අඹ යහළුවෝ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">අඹ යහළුවෝ</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">ටී. බී. ඉලංගරත්න</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 500.00</span>
                  </div>
                  <button className="text-[11px] md:text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 font-semibold text-gray-700 transition-all">
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}