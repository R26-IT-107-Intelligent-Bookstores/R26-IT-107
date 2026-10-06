"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiConfig';
import Swal from 'sweetalert2'; // ✅ SweetAlert2 import කර ඇත

type PhonoLexSearchProps = {
  compact?: boolean;
};

export default function PhonoLexSearch({ compact = false }: PhonoLexSearchProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]); 
  const [hasSearched, setHasSearched] = useState(false);

  // Reference for the Voice Recognition instance
  const recognitionRef = useRef<any>(null);

  // Initialize Speech API when the component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'si-LK'; // Set language to Sinhala

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript); 
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            setIsListening(false);
            return;
          }
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // ✅ යාවත්කාලීන කළ Common search function එක 
  const performSearch = async (searchString: string) => {
    if (!searchString.trim()) {
      Swal.fire('Oops!', 'Please enter a Singlish word to search.', 'warning');
      return;
    }
    
    console.log("Searching for:", searchString);
    
    // 1. Loading Popup එක පෙන්වීම
    Swal.fire({
        title: 'Searching...',
        text: 'AHPSA Algorithm is analyzing your input...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    try {
      const response = await fetch(`${getApiUrl()}/search?query=${encodeURIComponent(searchString)}`);
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const resultsArray = data.results || data.books || (Array.isArray(data) ? data : []);
      
      // ප්‍රධාන UI එක අප්ඩේට් කිරීම (පොත් Grid එක පෙන්වන්න)
      setSearchResults(resultsArray);
      setHasSearched(true);

// 2. ප්‍රතිඵල අනුව අදාළ Popup එක පෙන්වීම (Flow එක සහිතව)
      if (resultsArray && resultsArray.length > 0 && resultsArray[0].title !== "No matching books found.") {
          const bestMatch = resultsArray[0]; 

          Swal.fire({
              title: '⚙️ AHPSA Processing Flow',
              width: 600, // Flow එක පෙන්වන්න ඉඩ වැඩි කර ඇත
              html: `
                  <div style="text-align: left; font-size: 14px; line-height: 1.6; font-family: sans-serif;">
                      
                      <!-- Step 1: Input -->
                      <div style="display: flex; align-items: flex-start; margin-bottom: 5px;">
                          <div style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 5px; font-weight: bold; margin-right: 12px; min-width: 80px; text-align: center;">Step 1</div>
                          <div>
                              <div style="color: #6b7280; font-size: 12px;">User Input Received</div>
                              <div style="font-size: 16px;"><b>"${searchString}"</b></div>
                          </div>
                      </div>
                      
                      <div style="margin-left: 45px; border-left: 2px dashed #cbd5e1; padding-left: 20px; height: 25px;"></div>
                      
                      <!-- Step 2: AHPSA Translation -->
                      <div style="display: flex; align-items: flex-start; margin-bottom: 5px;">
                          <div style="background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 5px; font-weight: bold; margin-right: 12px; min-width: 80px; text-align: center;">Step 2</div>
                          <div>
                              <div style="color: #6b7280; font-size: 12px;">Hybrid Translation Engine</div>
                              <div>
                                  <span style="font-size: 11px; background: #f3f4f6; border: 1px solid #d1d5db; padding: 2px 6px; border-radius: 4px;">Rule-Based</span> + 
                                  <span style="font-size: 11px; background: #f3f4f6; border: 1px solid #d1d5db; padding: 2px 6px; border-radius: 4px;">Transformer ML</span>
                              </div>
                          </div>
                      </div>

                      <div style="margin-left: 45px; border-left: 2px dashed #cbd5e1; padding-left: 20px; height: 25px;"></div>

                      <!-- Step 3: Retrieval -->
                      <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                          <div style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 5px; font-weight: bold; margin-right: 12px; min-width: 80px; text-align: center;">Step 3</div>
                          <div>
                              <div style="color: #6b7280; font-size: 12px;">4-Tier Matching System</div>
                              <div>Matched via: <span style="color: #d97706; font-weight: bold;">${bestMatch.match_type || "Unknown"}</span></div>
                          </div>
                      </div>

                      <!-- Final Result -->
                      <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                          <h4 style="margin: 0 0 10px 0; color: #047857; display: flex; align-items: center; gap: 8px;">
                              ✅ Final Book Identified
                          </h4>
                          <table style="width: 100%; font-size: 14px;">
                              <tr><td style="padding: 4px 0; width: 80px; color: #4b5563;"><b>Title:</b></td><td style="color: #111827;">${bestMatch.title || "නම සඳහන් නැත"}</td></tr>
                              <tr><td style="padding: 4px 0; color: #4b5563;"><b>Author:</b></td><td style="color: #111827;">${bestMatch.author || "නොදනී"}</td></tr>
                          </table>
                      </div>
                  </div>
              `,
              confirmButtonText: 'View in Store',
              confirmButtonColor: '#0f766e'
          });
      } else {
          Swal.fire('No Results', 'No matching books found in the database.', 'info');
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire('Connection Error', 'Backend එකට කනෙක්ට් වෙන්න බැරි වුණා. Python සර්වර් එක Run වෙනවද බලන්න.', 'error');
    }
  };

  // Handle form submission (Pressing Enter or clicking the Search button)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // Toggle Microphone for Voice Search
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("ඔබගේ බ්‍රවුසරය Voice Search සඳහා සහය නොදක්වයි. කරුණාකර Google Chrome භාවිතා জ্ঞාවිතා කරන්න.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setQuery(""); 
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <form onSubmit={handleSearch} className={`flex items-center bg-white border border-gray-200 rounded-full shadow-lg focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all w-full max-w-4xl z-30 relative ${compact ? 'p-1' : 'p-1.5 md:p-2'}`}>
        
        {/* Mic Button */}
        <button 
          type="button"
          onClick={toggleListening}
          className={`${compact ? 'p-2' : 'p-3'} rounded-full transition-colors ml-1 flex items-center justify-center ${
            isListening 
              ? 'bg-red-100 text-red-600 animate-pulse' 
              : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
          }`}
          title="Search by Voice"
        >
          {isListening ? <Loader2 className={`${compact ? 'w-4 h-4' : 'w-4 h-4 md:w-5 md:h-5'} animate-spin`} /> : <Mic className={compact ? 'w-4 h-4' : 'w-4 h-4 md:w-5 md:h-5'} />}
        </button>
        
        {/* Text Input */}
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)} 
          placeholder={isListening ? "Listening... Speak in Sinhala" : "Search by book name, author, or category..."}
          className={`flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 w-full ${compact ? 'px-3 text-sm' : 'px-4 text-base md:px-5 md:text-lg'}`}
        />
        
        {/* Search Button */}
        <button 
          type="submit"
          className={`bg-teal-700 hover:bg-teal-800 text-white rounded-full flex items-center gap-2 font-bold transition-colors mr-1 ${compact ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-sm md:px-8 md:text-base'}`}
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
                <Link 
                  href={`/view/${encodeURIComponent(book.id || book._id || book.title)}?image=${encodeURIComponent(book.cover_image_url || '')}&title=${encodeURIComponent(book.title || '')}&author=${encodeURIComponent(book.author || '')}&isbn=${encodeURIComponent(book.isbn || '')}&price=${book.price || 0}`}
                  key={index} 
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group transform hover:-translate-y-1 cursor-pointer"
                >
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
                      <p className="text-sm text-gray-600">ISBN: <span className="font-medium text-gray-800">{book.isbn || "Not available"}</span></p>
                      <p className="text-sm text-gray-600">📚 කාණ්ඩය: <span className="text-teal-700 font-medium">{book.category || "වෙනත්"}</span></p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        Rs. {book.price ? book.price.toFixed(2) : "0.00"}
                      </span>
                      <span className="bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        විස්තර බලන්න
                      </span>
                    </div>
                  </div>
                </Link>
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