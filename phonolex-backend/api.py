from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from retrieval_engine import acoustic_match
from phonetic_engine import convert_to_sinhala, get_sinhala_suggestions
import urllib.parse 
import re

# Start API 
app = FastAPI(title="PhonoLex-SL API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome to PhonoLex-SL Search Engine API!"}

# ==========================================
# ENDPOINT: BEAM SEARCH SUGGESTIONS
# ==========================================
@app.get("/suggest")
def get_suggestions(query: str):
    """
    Returns top 3 Sinhala suggestions using Beam Search for the frontend dropdown.
    """
    decoded_query = urllib.parse.unquote(query)
    clean_query = re.sub(r'[.,]', '', decoded_query).strip().lower()
    
    # If the user is already typing in Sinhala, no need for Singlish suggestions
    if re.search(r'[\u0D80-\u0DFF]', clean_query):
        return {"suggestions": []}
        
    # Get top 3 Beam Search suggestions from the phonetic engine
    suggestions = get_sinhala_suggestions(clean_query, num_suggestions=3)
    return {"suggestions": suggestions}

# ==========================================
# UPDATED MAIN SEARCH ENDPOINT (OPTIMIZED FOR SPEED)
# ==========================================
@app.get("/search")
def search_books(query: str):
    # 1. Decode and Clean query
    decoded_query = urllib.parse.unquote(query)
    clean_query = re.sub(r'[.,]', '', decoded_query).strip().lower()
    
    # [Performance Optimization] Commented out redundant print statements
    # print(f"\n[API] Original query: {query}")
    # print(f"[API] Processed query: {clean_query}")
    
    results = []
    match_strategy = "Unknown"

    # 2. Check if Sinhala Unicode
    if re.search(r'[\u0D80-\u0DFF]', clean_query):
        # print(f"[VOICE/DIRECT] Sinhala detected")
        results = acoustic_match(clean_query)
        match_strategy = "Direct Sinhala / Voice"
    else:
        # 🌟 THE FINAL BULLETPROOF LOGIC 🌟
        # print(f"[HYBRID] Step 1: Searching DB for '{clean_query}'...")
        direct_results = acoustic_match(clean_query)
        
        # Calculate the best score from direct database match
        top_direct_score = 0
        if len(direct_results) > 0 and isinstance(direct_results[0], dict):
            top_direct_score = direct_results[0].get("score", 0)
        
        # print(f"[HYBRID] Direct match top score: {top_direct_score}")

        # Step 2: Try AI prediction using the new Transformer Hybrid engine
        # print(f"[HYBRID] Step 2: Getting AI prediction...")
        sinhala_pred = convert_to_sinhala(clean_query)
        
        ai_results = []
        top_ai_score = 0
        if sinhala_pred and len(sinhala_pred) > 1:
            # print(f"[AI] Predicted: {sinhala_pred}")
            ai_results = acoustic_match(sinhala_pred)
            if len(ai_results) > 0 and isinstance(ai_results[0], dict):
                top_ai_score = ai_results[0].get("score", 0)

        # Step 3: THE WINNER SELECTION
        # We only use AI results if they are significantly better than the direct match
        if top_ai_score > top_direct_score:
            # print(f"[WINNER] AI won with score {top_ai_score}")
            results = ai_results
            match_strategy = f"AI Prediction ({sinhala_pred})"
        else:
            # print(f"[WINNER] Direct DB match won")
            results = direct_results
            match_strategy = "Direct Singlish DB Match"

    # FINAL CHECK: If everything failed, try one last direct match
    if len(results) == 0:
        results = acoustic_match(clean_query)
        match_strategy = "Fallback Match"

    # Calculate total results for the frontend
    if len(results) == 0 or (isinstance(results[0], dict) and results[0].get("title") == "No matching books found."):
        total_results = 0
    else:
        total_results = len(results)
    
    # A single, clean, informative log line for server monitoring
    print(f"⚡ [SEARCH SUMMARY] Query: '{clean_query}' | Strategy: {match_strategy} | Found: {total_results} books")
    
    return {
        "search_query": clean_query,
        "total_results": total_results,
        "results": results 
    }