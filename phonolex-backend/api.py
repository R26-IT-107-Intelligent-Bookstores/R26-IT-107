from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from retrieval_engine import acoustic_match
import urllib.parse # අලුතින් එකතු කළ කොටස

# API එක ආරම්භ කිරීම
app = FastAPI(title="PhonoLex-SL API", version="1.0")

# යාළුවාගේ වෙබ් සයිට් එකට (Frontend) මේකට කතා කරන්න අවසර දීම (CORS Rules)
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
    
    # දැන් ප්‍රතිඵල ලබාගැනීමට පිරිසිදු කළ වචනය යවමු
    results = acoustic_match(decoded_query)
    
    return {
        "search_query": decoded_query,
        "total_results": len(results) if results[0] != "No matching books found." else 0,
        "books": results
    }