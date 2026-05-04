import React from 'react';
import { BookOpen, Search, Mic, Bell, ShoppingCart, User, ChevronLeft, ChevronRight, TrendingUp, Flame, Heart, MessageCircle, Repeat2, ExternalLink, Headphones, Users, BookMarked, Sparkles } from 'lucide-react';
import PhonoLexSearch from '@/components/PhonoLexSearch';

export default function HomePage() {
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
          <a href="#" className="text-teal-800 font-bold border-b-2 border-teal-800 pb-0.5">Discover</a>
          <a href="#" className="hover:text-teal-700 transition-colors pb-0.5">Categories</a>
          <a href="#" className="hover:text-teal-700 transition-colors pb-0.5">Price Alerts</a>
          <a href="#" className="hover:text-teal-700 transition-colors pb-0.5">Community</a>
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
          <button className="p-2 text-gray-600 hover:text-teal-700 transition-colors">
            <User className="w-5 h-5" />
          </button>
          <button className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors shadow-sm">
            Sign In
          </button>
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
          <div className="w-full max-w-3xl mx-auto mb-12 z-20 relative">
             <PhonoLexSearch />
          </div>

          {/* Horizontal Scrolling Image Banners Section */}
          {/* ... (Banner section kept exactly the same as your original code) ... */}
          <div className="w-full mb-12 relative">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 px-2 scroll-smooth [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:bg-teal-600/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-teal-600/70 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full">
              
              <div className="snap-center shrink-0 w-full md:w-[85%] lg:w-[75%] relative rounded-3xl overflow-hidden shadow-md group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop" alt="Special Offer Banner" className="w-full h-48 md:h-72 object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/90 via-teal-900/60 to-transparent flex items-center p-8 md:p-12 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Limited Time</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Weekend Sale</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-teal-50">Get up to 50% off on all award-winning Sinhala translations.</p>
                    <button className="bg-white text-teal-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-teal-50 transition-colors shadow-sm">Shop Now</button>
                  </div>
                </div>
              </div>

            </div>
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

        {/* For You Section (UPDATED WITH SINHALA BOOKS) */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-teal-700 text-xl">✨</span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">For You</h2>
              </div>
              <p className="text-sm md:text-base text-gray-500">Based on your Literary Vibe & Cultural Ontology</p>
            </div>
            <div className="flex gap-3">
              <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Book Card 1 */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col group cursor-pointer">
              <div className="relative h-72 bg-gray-100 overflow-hidden">
                <div className="absolute top-3 left-3 bg-teal-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full z-10 shadow-md">
                  92% Match: Narrative Style
                </div>
                <img src="/images/senkottan.jpg" alt="සෙන්කොට්ටං" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">සෙන්කොට්ටං</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">මහින්ද ප්‍රසාද් මස්ඉඹුල</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 850.00</span>
                    <TrendingUp className="w-4 h-4 text-red-400" />
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
                  88% Match: Cultural Depth
                </div>
                <img src="/images/guru-geethaya.jpg" alt="ගුරු ගීතය" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">ගුරු ගීතය</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">චිංගීස් අයිත්මාතව්</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 650.00</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
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
                  85% Match: Emotional Arc
                </div>
                <img src="/images/madol-doova.jpg" alt="මඩොල් දූව" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">මඩොල් දූව</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">මාර්ටින් වික්‍රමසිංහ</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 450.00</span>
                    <TrendingUp className="w-4 h-4 text-gray-400" />
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
                  82% Match: Voice & Tone
                </div>
                <img src="/images/alimankada.jpg" alt="අලිමංකඩ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">අලිමංකඩ</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">නිහාල් ද සිල්වා</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 950.00</span>
                    <TrendingUp className="w-4 h-4 text-red-400" />
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
                  80% Match: Setting
                </div>
                <img src="/images/amba-yaluwo.jpg" alt="අඹ යහළුවෝ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">අඹ යහළුවෝ</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">ටී. බී. ඉලංගරත්න</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">Rs. 500.00</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <button className="text-[11px] md:text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 font-semibold text-gray-700 transition-all">
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Now Section (UPDATED WITH SINHALA BOOKS) */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-7 h-7 text-red-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Now</h2>
          </div>
          <p className="text-sm md:text-base text-gray-500 mb-8">High Demand: Academic & Social Buzz across the Fediverse</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Trending Card 1 */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row h-auto sm:h-56">
              <div className="relative w-full sm:w-2/5 h-48 sm:h-full bg-gray-100 shrink-0">
                <div className="absolute top-3 left-3 bg-teal-900 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                  95% Epic Narrative
                </div>
                <img src="/images/yakada-silbara.jpg" alt="යකඩ සිල්බර" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base md:text-xl mb-1 line-clamp-2">යකඩ සිල්බර</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4">මහින්ද ප්‍රසාද් මස්ඉඹුල</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-xl md:text-2xl text-gray-900">Rs. 1200.00</span>
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-medium text-gray-500">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 hover:text-red-500 cursor-pointer transition-colors"><Heart className="w-4 h-4" /> 1.2k</span>
                      <span className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer transition-colors"><MessageCircle className="w-4 h-4" /> 587</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px]">Fediverse</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Card 2 */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row h-auto sm:h-56">
              <div className="relative w-full sm:w-2/5 h-48 sm:h-full bg-gray-100 shrink-0">
                <div className="absolute top-3 left-3 bg-teal-700 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                  89% Literary Fiction
                </div>
                <img src="/images/kalu.jpg" alt="කළු" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base md:text-xl mb-1 line-clamp-2">කළු</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4">සුජීව ප්‍රසන්නආරච්චි</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-xl md:text-2xl text-gray-900">Rs. 1500.00</span>
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-medium text-gray-500">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 hover:text-red-500 cursor-pointer transition-colors"><Heart className="w-4 h-4" /> 678</span>
                      <span className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer transition-colors"><MessageCircle className="w-4 h-4" /> 145</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px]">Fediverse</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Trending Card 3 */}
            <div className="hidden lg:flex border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row h-auto sm:h-56">
              <div className="relative w-full sm:w-2/5 h-48 sm:h-full bg-gray-100 shrink-0">
                <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                  85% Cultural Memoir
                </div>
                <img src="/images/harry-potter.jpg" alt="හැරී පොටර් සහ මායා ගල" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-xl mb-1">හැරී පොටර් සහ මායා ගල</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4">ජේ. කේ. රෝලිං</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-xl md:text-2xl text-gray-900">Rs. 1850.00</span>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-medium text-gray-500">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 hover:text-red-500 cursor-pointer transition-colors"><Heart className="w-4 h-4" /> 450</span>
                      <span className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer transition-colors"><MessageCircle className="w-4 h-4" /> 89</span>
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px]">Fediverse</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ... (අනෙකුත් Open Web Community Reviews සහ Footer කොටස් වෙනස් නොකර එලෙසම තබා ඇත) ... */}
        {/* ... (ඔයාගේ මුල් කෝඩ් එකේ පහළ කොටස මෙතනින් පහළට එලෙසම වැඩ කරාවි) ... */}
        
      </main>
    </div>
  );
}