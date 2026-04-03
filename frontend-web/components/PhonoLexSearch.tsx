"use client";

import React, { useState } from 'react';
import { Mic, Search, Loader2 } from 'lucide-react';

export default function PhonoLexSearch() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", query);
    // 💡 මෙතනට තමයි ඔයාගේ Python Backend එකට (PhonoLex-SL Engine) Request එක යවන කේතය අනාගතයේදී එන්නේ
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log("Started listening...");
      // 💡 මෙතනට තමයි Web Speech API එක හරි ඔයාගේ Voice Recording කේතය හරි එන්නේ
    } else {
      console.log("Stopped listening.");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-200 rounded-full p-1.5 md:p-2 shadow-lg focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all w-full">
      
      {/* Mic Button - Listening වෙලාවට රතු පාටින් Pulse වෙනවා */}
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
        /* 👇 වෙනස කළේ මෙතනයි: Singlish වෙනුවට Sinhala දැම්මා 👇 */
        placeholder={isListening ? "Listening... Speak in Sinhala" : "Search your favorite book... (Speak or type in Sinhala)"}
        className="flex-1 bg-transparent outline-none px-4 md:px-5 text-gray-700 placeholder-gray-400 text-base md:text-lg"
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
  );
}