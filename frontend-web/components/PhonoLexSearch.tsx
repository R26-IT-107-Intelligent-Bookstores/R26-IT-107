"use client";

import React, { useState } from 'react';
import { Mic, Search, Loader2 } from 'lucide-react';

export default function PhonoLexSearch() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // What happens when the Search button is clicked
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    console.log("Searching for:", query);
    
    try {
      // Sending the request to your Python API (make sure the port is 8000)
      const response = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      console.log("Backend Results:", data);
      
      // Temporarily showing the result in an Alert
      if (data.total_results > 0) {
        alert(`Success!\nYou searched for: ${data.search_query}\nNumber of books: ${data.total_results}\n\nFirst book: ${data.books[0]}`);
      } else {
        alert(`No books found for '${data.search_query}'.`);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to connect to the backend. Please check if the Python server is running.");
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log("Started listening...");
      // 💡 Web Speech API or your Voice Recording code goes here
    } else {
      console.log("Stopped listening.");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-200 rounded-full p-1.5 md:p-2 shadow-lg focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all w-full">
      
      {/* Mic Button - Pulses in red when listening */}
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
      
      {/* Text Input - Comment removed to fix the error */}
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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