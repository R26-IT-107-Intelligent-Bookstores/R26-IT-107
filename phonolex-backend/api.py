from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from retrieval_engine import acoustic_match
import urllib.parse 
import re
from ml_engine import ml_engine as seq2seq_model

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

@app.get("/search")
def search_books(query: str):
    """
    Takes the word provided by the user (query), searches for books through our 
    PhonoLex system, and returns the results in JSON format.
    """
    
    # Converting characters like %20 in the URL into normal spaces
    decoded_query = urllib.parse.unquote(query)
    
    print(f"\n[API] Original query: {query}")
    print(f"[API] Decoded query: {decoded_query}")
    
    # Remove punctuations like '.' and ','
    clean_query = re.sub(r'[.,]', '', decoded_query)
    
    # Check if query contains Sinhala Unicode
    if re.search(r'[\u0D80-\u0DFF]', clean_query):
        # Bypass seq2seq model and pass directly to acoustic_match
        results = acoustic_match(clean_query)
    else:
        # Pass through seq2seq_model.predict()
        sinhala_query = seq2seq_model.predict_sinhala(clean_query)
        if sinhala_query:
            results = acoustic_match(sinhala_query)
        else:
            results = acoustic_match(clean_query)
    
    # 🌟 This is where we made the new changes (Safely calculating the results)
    if len(results) == 0:
        total_results = 0
    elif isinstance(results[0], dict) and results[0].get("title") == "No matching books found.":
        total_results = 0
    elif isinstance(results[0], str) and results[0] == "No matching books found.":
        total_results = 0
    else:
        total_results = len(results)
    
    return {
        "search_query": clean_query,
        "total_results": total_results,
        "results": results 
    }