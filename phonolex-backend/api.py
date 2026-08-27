from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from retrieval_engine import acoustic_match
from phonetic_engine import convert_to_sinhala, get_sinhala_suggestions
import urllib.parse 
import re
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# 1. Load environment variables from .env file
load_dotenv()

# 2. Read both Global MongoDB URLs from .env
MY_MONGO_URI = os.getenv("MY_MONGO_URI")
LAKINI_MONGO_URI = os.getenv("LAKINI_MONGO_URI")

# 3. Connect Async Motor Client to YOUR MongoDB Atlas (For Authentication & Books Search)
client_mine = AsyncIOMotorClient(MY_MONGO_URI)
database_mine = client_mine["phonolex_db"]
users_collection = database_mine["users"]     
books_collection = database_mine["books"]     

# 4. Connect Async Motor Client to LAKINI'S MongoDB Atlas (For TrendStock Modules)
client_lakini = AsyncIOMotorClient(LAKINI_MONGO_URI)
database_lakini = client_lakini["trendstock"]  
branches_collection = database_lakini["branches"] 
sales_collection = database_lakini["sales"]

# Password Hashing Setup
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

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

@app.get("/")
def home():
    return {"message": "Welcome to PhonoLex-SL Search Engine API!"}

# ==========================================
# ENDPOINT: ROLE-BASED AUTHENTICATION (SIGN UP)
# ==========================================
@app.post("/api/auth/signup")
async def signup(data: SignUpModel):
    """
    Handles secure user and admin registration in MongoDB Cloud.
    """
    # 1. Check if username already exists in database
    existing_user = await users_collection.find_one({"username": data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # 2. Hash the password for security
    hashed_password = hash_password(data.password)
    
    # 3. Insert new user document into MongoDB
    new_user = {
        "username": data.username,
        "password": hashed_password,
        "role": data.role  # "user" or "admin"
    }
    await users_collection.insert_one(new_user)
    
    return {"success": True, "message": "User registered successfully in MongoDB"}

# ==========================================
# ENDPOINT: ROLE-BASED AUTHENTICATION (LOGIN)
# ==========================================
@app.post("/api/auth/login")
async def login(data: LoginModel):
    """
    Validates user credentials against MongoDB and returns role privileges.
    """
    # 1. Find user by username
    user = await users_collection.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # 2. Verify password against the hashed password in DB
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "success": True,
        "username": user["username"],
        "role": user["role"]
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


@app.get("/books")
async def get_all_books():
    """Return the PhonoLex book collection for the Book Details grid."""
    books = await books_collection.find({}, {"_id": 0}).to_list(length=None)
    return {"books": books, "total": len(books)}

