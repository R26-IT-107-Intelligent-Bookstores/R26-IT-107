"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Search, Loader2 } from 'lucide-react';

export default function PhonoLexSearch() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]); 
  const [hasSearched, setHasSearched] = useState(false);

  // 🌟 Voice Recognition සඳහා Ref එකක්
  const recognitionRef = useRef<any>(null);

  // 🌟 Component එක ලෝඩ් වෙද්දී Speech API එක සූදානම් කිරීම
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'si-LK'; // භාෂාව සිංහල ලෙස සැකසීම

        // කටහඬ අඳුරගත්තාම වෙන දේ
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript); // කියපු දේ සර්ච් බාර් එකට දානවා
        };

        // වැරදීමක් වුණොත්
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        // කතා කරලා ඉවර වුණාම මයික් එක ඕෆ් කරනවා
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    console.log("Searching for:", query);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      const resultsArray = data.results || data.books || (Array.isArray(data) ? data : []);
      
      setSearchResults(resultsArray);
      setHasSearched(true);

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Backend එකට කනෙක්ට් වෙන්න බැරි වුණා. Python සර්වර් එක Run වෙනවද බලන්න.");
    }
  };

  // 🌟 මයික් එක On/Off කරන ෆන්ක්ෂන් එක
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("ඔබගේ බ්‍රවුසරය Voice Search සඳහා සහය නොදක්වයි. කරුණාකර Google Chrome භාවිතා කරන්න.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setQuery(""); // අලුතින් කතා කරද්දී පරණ සර්ච් එක මකා දැමීම
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-200 rounded-full p-1.5 md:p-2 shadow-lg focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all w-full max-w-4xl z-20 relative">
        
        {/* Mic Button */}
        <button 
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-full transition-colors ml-1 flex items-center justify-center ${
            isListening 
              ? 'bg-red-100 text-red-600 animate-pulse' 
              : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
          }`}
          title="Search by Voice"
        >
          {isListening ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        
        {/* Text Input */}
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isListening ? "Listening... Speak in Sinhala" : "Search your favorite book... (Speak or type in Sinhala)"}
          className="flex-1 bg-transparent outline-none px-4 md:px-5 text-gray-700 placeholder-gray-400 text-base md:text-lg w-full"
        />
        
        {/* Search Button */}
        <button 
          type="submit"
          className="bg-teal-700 hover:bg-teal-800 text-white px-6 md:px-8 py-3 rounded-full flex items-center gap-2 font-bold transition-colors mr-1 text-sm md:text-base"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {/* Search Results Section */}
      {hasSearched && (
        <div className="mt-12 w-full max-w-6xl mx-auto px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">සෙවුම් ප්‍රතිඵල</h2>
          
          {searchResults.length > 0 && searchResults[0].title !== "No matching books found." ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {searchResults.map((book, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group transform hover:-translate-y-1">
                  <div className="h-48 relative overflow-hidden bg-gray-100">
                    {book.cover_image_url ? (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title || "Book Cover"} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-emerald-400', 'to-teal-600', 'flex', 'items-center', 'justify-center');
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<span class="text-6xl group-hover:scale-110 transition-transform duration-300">📖</span>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">📖</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col bg-white z-10">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                        {book.title || "නම සඳහන් නැත"}
                      </h3>
                      {book.match_type && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full text-center whitespace-nowrap ${book.match_type === 'Exact Substring Match' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                          {book.match_type === "Exact Substring Match" ? "🎯 හරියටම" : "🔊 ශබ්දයෙන්"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-sm text-gray-600">✍️ කර්තෘ: <span className="font-medium text-gray-800">{book.author || "නොදනී"}</span></p>
                      <p className="text-sm text-gray-600">📚 කාණ්ඩය: <span className="text-teal-700 font-medium">{book.category || "වෙනත්"}</span></p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        Rs. {book.price ? book.price.toFixed(2) : "0.00"}
                      </span>
                      <button className="bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 hover:text-white transition-colors">
                        මිලදී ගන්න
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
              <span className="text-6xl mb-4 block">😔</span>
              <p className="text-gray-800 text-2xl font-bold mb-2">සමාවෙන්න, එම නමින් පොතක් අප සතුව නැත.</p>
              <p className="text-gray-500">කරුණාකර වෙනත් නමක් හෝ අකුරක් වෙනස් කර නැවත සොයන්න.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}