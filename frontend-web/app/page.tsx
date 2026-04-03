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

          {/* Horizontal Scrolling Image Banners Section (With Visible Custom Scrollbar) */}
          <div className="w-full mb-12 relative">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 px-2 scroll-smooth [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:bg-teal-600/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-teal-600/70 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full">
              
              {/* Banner 1 */}
              <div className="snap-center shrink-0 w-full md:w-[85%] lg:w-[75%] relative rounded-3xl overflow-hidden shadow-md group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop" 
                  alt="Special Offer Banner" 
                  className="w-full h-48 md:h-72 object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/90 via-teal-900/60 to-transparent flex items-center p-8 md:p-12 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Limited Time</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Weekend Sale</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-teal-50">Get up to 50% off on all award-winning Sinhala translations.</p>
                    <button className="bg-white text-teal-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-teal-50 transition-colors shadow-sm">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner 2 */}
              <div className="snap-center shrink-0 w-full md:w-[85%] lg:w-[75%] relative rounded-3xl overflow-hidden shadow-md group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop" 
                  alt="New Arrivals Banner" 
                  className="w-full h-48 md:h-72 object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent flex items-center p-8 md:p-12 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">New Arrivals</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Fresh Voices</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-gray-100">Discover the latest contemporary Sri Lankan fiction added this week.</p>
                    <button className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm">
                      Explore Collection
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner 3 */}
              <div className="snap-center shrink-0 w-full md:w-[85%] lg:w-[75%] relative rounded-3xl overflow-hidden shadow-md group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1456615074700-1dc12aa7364d?q=80&w=1200&auto=format&fit=crop" 
                  alt="Audiobooks Banner" 
                  className="w-full h-48 md:h-72 object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/60 to-transparent flex items-center p-8 md:p-12 text-left">
                  <div className="text-white max-w-lg">
                    <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Audiobooks</span>
                    <h3 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">Listen Anywhere</h3>
                    <p className="text-sm md:text-lg opacity-90 mb-6 text-purple-50">Experience books in a new way with our extensive Sinhala & English audiobook library.</p>
                    <button className="bg-white text-purple-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-purple-50 transition-colors shadow-sm">
                      Start Listening
                    </button>
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
            <div className="w-px h-10 bg-gray-200"></div> {/* Separator */}
            <div className="flex items-center gap-3">
              <BookMarked className="w-5 h-5 text-teal-600" />
              <div className='flex flex-col items-start'>
                <span className="font-extrabold text-xl">10k+</span>
                <span className="text-xs text-gray-500 font-medium">Singlish Titles</span>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div> {/* Separator */}
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
                <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop" alt="Book Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">The Glass Palace</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">Amitav Ghosh</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">$24.99</span>
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
                <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop" alt="Book Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">Midnight's Children</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">Salman Rushdie</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">$18.50</span>
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
                <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop" alt="Book Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">A Fine Balance</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">Rohinton Mistry</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">$21.00</span>
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
                <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop" alt="Book Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">The White Tiger</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">Aravind Adiga</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">$15.99</span>
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
                <img src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=600&auto=format&fit=crop" alt="Book Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-teal-700 transition-colors">Village in the Jungle</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-4">Leonard Woolf</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg md:text-xl text-gray-900">$14.50</span>
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

        {/* Trending Now Section */}
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
                <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop" alt="Ponniyin Selvan" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base md:text-xl mb-1 line-clamp-2">Ponniyin Selvan</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4">Kalki Krishnamurthy</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-xl md:text-2xl text-gray-900">$32.99</span>
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-medium text-gray-500">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 hover:text-red-500 cursor-pointer transition-colors"><Heart className="w-4 h-4" /> 1.2k</span>
                      <span className="flex items-center gap-1.5 hover:text-blue-500 cursor-pointer transition-colors"><MessageCircle className="w-4 h-4" /> 567</span>
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
                <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop" alt="Island of a Thousand Mirrors" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base md:text-xl mb-1 line-clamp-2">Island of a Thousand Mirrors</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4">Nayomi Munaweera</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-xl md:text-2xl text-gray-900">$19.99</span>
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
                <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop" alt="Running in the Family" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-xl mb-1">Running in the Family</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4">Michael Ondaatje</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="font-bold text-xl md:text-2xl text-gray-900">$22.50</span>
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

        {/* Separated Open Web Community Reviews Section */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Open Web Community Reviews</h2>
              <p className="text-sm md:text-base text-gray-500 mt-1">Real-time discussions via ActivityPub (FedBook-Sem Protocol)</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 text-green-700 rounded-full text-xs font-bold shadow-sm w-fit">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live Stream
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Review Card 1 */}
            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 flex flex-col hover:border-teal-300 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold text-base">AR</div>
                <div>
                  <p className="text-sm md:text-base font-bold text-gray-900">Aisha Rahman</p>
                  <p className="text-xs md:text-sm text-teal-600">@aisha@readers.social</p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Just now</span>
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed flex-1">
                Voice search in Singlish is a game changer! Finally a bookstore that understands how we actually talk. I found the exact book I was looking for using "kannadi dapu aiya liyapu potha". 😂👏
              </p>
              <div className="flex items-center gap-6 text-gray-500 border-t border-gray-100 pt-4">
                <button className="hover:text-red-500 transition-colors flex items-center gap-2 font-medium"><Heart className="w-4 h-4" /> <span className='text-xs'>24</span></button>
                <button className="hover:text-green-500 transition-colors flex items-center gap-2 font-medium"><Repeat2 className="w-4 h-4" /> <span className='text-xs'>5</span></button>
                <button className="hover:text-blue-500 transition-colors flex items-center gap-2 font-medium ml-auto text-xs"><ExternalLink className="w-3.5 h-3.5" /> View</button>
              </div>
            </div>

            {/* Review Card 2 */}
            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 flex flex-col hover:border-teal-300 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-base">SP</div>
                <div>
                  <p className="text-sm md:text-base font-bold text-gray-900">Sam Perera</p>
                  <p className="text-xs md:text-sm text-teal-600">@sam@bookwyrm.social</p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">5m ago</span>
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed flex-1">
                Loving the semantic match feature via PhonoLex-SL. I just asked for books similar to Martin Wickramasinghe's style and got some amazing modern recommendations.
              </p>
              <div className="flex items-center gap-6 text-gray-500 border-t border-gray-100 pt-4">
                <button className="hover:text-red-500 transition-colors flex items-center gap-2 font-medium"><Heart className="w-4 h-4" /> <span className='text-xs'>112</span></button>
                <button className="hover:text-green-500 transition-colors flex items-center gap-2 font-medium"><Repeat2 className="w-4 h-4" /> <span className='text-xs'>14</span></button>
                <button className="hover:text-blue-500 transition-colors flex items-center gap-2 font-medium ml-auto text-xs"><ExternalLink className="w-3.5 h-3.5" /> View</button>
              </div>
            </div>

            {/* Review Card 3 */}
            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 flex flex-col hover:border-teal-300 transition-colors hidden md:flex">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-800 font-bold text-base">DK</div>
                <div>
                  <p className="text-sm md:text-base font-bold text-gray-900">Dinuka K.</p>
                  <p className="text-xs md:text-sm text-teal-600">@dinuka@mastodon.lk</p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">12m ago</span>
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed flex-1">
                The dynamic pricing alerts saved me $5 on a textbook today. Combining decentralized social graphs with smart e-commerce is the future of online bookstores. Great project!
              </p>
              <div className="flex items-center gap-6 text-gray-500 border-t border-gray-100 pt-4">
                <button className="hover:text-red-500 transition-colors flex items-center gap-2 font-medium"><Heart className="w-4 h-4" /> <span className='text-xs'>89</span></button>
                <button className="hover:text-green-500 transition-colors flex items-center gap-2 font-medium"><Repeat2 className="w-4 h-4" /> <span className='text-xs'>22</span></button>
                <button className="hover:text-blue-500 transition-colors flex items-center gap-2 font-medium ml-auto text-xs"><ExternalLink className="w-3.5 h-3.5" /> View</button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button className="bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-50 px-7 py-2.5 rounded-full font-bold transition-colors inline-flex items-center gap-2 shadow-sm text-sm">
              <ExternalLink className="w-4 h-4" /> View full feed on Fediverse
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 mt-10">
        <div className="w-full px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 text-teal-800 mb-5">
                <div className="bg-teal-800 p-2 rounded-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">Intelligent Bookstore</span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed pr-4 font-medium">
                Next-generation intelligent bookstore powered by semantic search and federated social interactions. Designed for the modern reader.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-5 text-sm md:text-base">Platform Features</h4>
              <ul className="space-y-3 text-xs md:text-sm text-gray-500 font-semibold">
                <li><a href="#" className="hover:text-teal-700 transition-colors">Voice Search (Singlish)</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">Semantic Book Matching</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">Dynamic Pricing Engine</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">Federated Reviews Sync</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-5 text-sm md:text-base">Core Technologies</h4>
              <ul className="space-y-3 text-xs md:text-sm text-gray-500 font-semibold">
                <li><a href="#" className="hover:text-teal-700 transition-colors">PhonoLex-SL Engine</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">SSKG-SL Knowledge Graph</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">MusePrice AI Models</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">FedBook-Sem Protocol</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-5 text-sm md:text-base">Connect & Community</h4>
              <ul className="space-y-3 text-xs md:text-sm text-gray-500 font-semibold">
                <li><a href="#" className="hover:text-teal-700 transition-colors flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Join on Mastodon</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> ActivityPub Feed</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">Developer API Docs</a></li>
                <li><a href="#" className="hover:text-teal-700 transition-colors">Open Source GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-400">
            <p>© 2026 Intelligent Bookstore. Built with open protocols.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-teal-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-teal-600 transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}