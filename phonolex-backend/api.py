from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# ==========================================
# AUTHENTICATION DATA MODELS & SCHEMAS
# ==========================================
class SignUpModel(BaseModel):
    username: str
    password: str
    role: str  # Expected values: "user" or "admin"

class LoginModel(BaseModel):
    username: str
    password: str

# In-memory User Database (Temporary local mockup)
# Note: You can link this structure to your main MongoDB instance later.
USERS_DB = {
    "admin": {"password": "admin123", "role": "admin"},
    "nirmani": {"password": "password123", "role": "user"}
}

@app.get("/")
def home():
    return {"message": "Welcome to PhonoLex-SL Search Engine API!"}

# ==========================================
# ENDPOINT: ROLE-BASED AUTHENTICATION (SIGN UP)
# ==========================================
@app.post("/api/auth/signup")
def signup(data: SignUpModel):
    """
    Handles secure user and admin registration.
    """
    if data.username in USERS_DB:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Store registration details locally
    USERS_DB[data.username] = {"password": data.password, "role": data.role}
    return {"success": True, "message": "User registered successfully"}

# ==========================================
# ENDPOINT: ROLE-BASED AUTHENTICATION (LOGIN)
# ==========================================
@app.post("/api/auth/login")
def login(data: LoginModel):
    """
    Validates user credentials and passes back role privileges to the frontend client.
    """
    user = USERS_DB.get(data.username)
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "success": True,
        "username": data.username,
        "role": user["role"]  # "user" or "admin" route parameters
    }

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
    
    results = []
    match_strategy = "Unknown"

    # 2. Check if Sinhala Unicode
    if re.search(r'[\u0D80-\u0DFF]', clean_query):
        results = acoustic_match(clean_query)
        match_strategy = "Direct Sinhala / Voice"
    else:
        # 🌟 THE FINAL BULLETPROOF LOGIC 🌟
        direct_results = acoustic_match(clean_query)
        
        # Calculate the best score from direct database match
        top_direct_score = 0
        if len(direct_results) > 0 and isinstance(direct_results[0], dict):
            top_direct_score = direct_results[0].get("score", 0)
        
        # Step 2: Try AI prediction using the new Transformer Hybrid engine
        sinhala_pred = convert_to_sinhala(clean_query)
        
        ai_results = []
        top_ai_score = 0
        if sinhala_pred and len(sinhala_pred) > 1:
            ai_results = acoustic_match(sinhala_pred)
            if len(ai_results) > 0 and isinstance(ai_results[0], dict):
                top_ai_score = ai_results[0].get("score", 0)

        # Step 3: THE WINNER SELECTION
        if top_ai_score > top_direct_score:
            results = ai_results
            match_strategy = f"AI Prediction ({sinhala_pred})"
        else:
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