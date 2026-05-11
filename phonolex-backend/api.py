from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from retrieval_engine import acoustic_match
import urllib.parse # අලුතින් එකතු කළ කොටස
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
    පරිශීලකයා ලබාදෙන වචනය (query) ලබාගෙන අපගේ PhonoLex පද්ධතිය හරහා 
    පොත් සොයා ප්‍රතිඵල JSON ආකාරයෙන් නැවත ලබා දෙයි.
    """
    
    # URL එකේ තියෙන %20 වැනි අකුරු සාමාන්‍ය හිස්තැන් බවට පත් කිරීම
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
    
    # 🌟 මෙන්න මෙතන තමයි අපි අලුතින් හැදුවේ (ආරක්ෂිතව ප්‍රතිඵල ගණනය කිරීම)
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