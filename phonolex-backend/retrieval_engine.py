from pymongo import MongoClient
from soundex_engine import sinhala_soundex
from phonetic_engine import convert_to_sinhala 
import difflib
import re
from functools import lru_cache

# ==========================================
# 🌟 1. IN-MEMORY BOOK CACHE & PRE-COMPUTATION 🌟
# ==========================================
# මේකෙන් කරන්නේ සර්වර් එක ඔන් වෙද්දී එකම එක පාරක් ඩේටාබේස් එකෙන් පොත් ගෙනත්,
# ඒවගේ Phonetic සහ Soundex කලින්ම හදලා RAM එකේ තියාගන්න එකයි.
_CACHED_BOOKS = None

def get_data():
    global _CACHED_BOOKS
    if _CACHED_BOOKS is not None:
        return _CACHED_BOOKS

    print("⏳ [DATABASE] Connecting to MongoDB and pre-computing hashes...")
    try:
        client = MongoClient("mongodb+srv://nirmanichethana02_db_user:Nirmani%21%21%40%40206@cluster0.kb5tqe6.mongodb.net/?appName=Cluster0")
        db = client["phonolex_db"]
        books = list(db["books"].find({}, {"_id": 0}))
        
        # Pre-compute phonetic roots and soundex hashes once at startup
        for book in books:
            title = book.get("title", "")
            book["_encoded_title"] = phonetic_encode(title)
            book["_soundex_title"] = sinhala_soundex(title)
            book["_soundex_words"] = [sinhala_soundex(w) for w in title.split()]
            
        _CACHED_BOOKS = books
        print(f"✅ [DATABASE] Successfully loaded and pre-computed {len(books)} books into memory!")
        return _CACHED_BOOKS
    except Exception as e:
        print(f"❌ [DATABASE ERROR] Failed to connect to DB: {e}")
        return []

# ==========================================
# 2. PHONETIC ENCODING ALGORITHM
# ==========================================
@lru_cache(maxsize=1024)
def phonetic_encode(word: str) -> str:
    """
    Sinhala Phonetic Encoding Algorithm (PhonoLex-SL)
    Converts a Singlish word into its base phonetic root by normalizing 
    vowels and grouping similar-sounding consonants.
    """
    if not word:
        return ""
        
    word = str(word).lower().strip()

    # Consonant Grouping (ව්‍යාංජන කාණ්ඩ කිරීම)
    word = re.sub(r'sh', 's', word)  
    word = re.sub(r'th', 't', word)  
    word = re.sub(r'dh', 'd', word)  
    word = re.sub(r'v', 'w', word)   
    word = re.sub(r'ph', 'f', word)  

    # Vowel Normalization (ස්වර සමාන කිරීම)
    word = re.sub(r'ae|aa|ea|ee', 'A', word)
    word = re.sub(r'[ae]', 'A', word)
    word = re.sub(r'ii|ie', 'I', word)
    word = re.sub(r'[iy]', 'I', word)
    word = re.sub(r'oo|ou', 'U', word)
    word = re.sub(r'[ou]', 'U', word)

    # Remove duplicate consecutive characters
    word = re.sub(r'(.)\1+', r'\1', word)

    return word

def is_fuzzy_match(query, target_text, threshold=0.75):
    if not target_text:
        return False
    target_text = str(target_text).lower()
    query = str(query).lower()

    if query in target_text:
        return True

    for word in target_text.split():
        if difflib.SequenceMatcher(None, query, word).ratio() >= threshold:
            return True
    return False

# ==========================================
# 🌟 3. MAIN ACOUSTIC MATCHING ENGINE (OPTIMIZED) 🌟
# ==========================================
@lru_cache(maxsize=512)
def acoustic_match(query):
    all_books = get_data() 
    if not all_books:
        return []

    results = []
    seen_titles = set()

    try:
        sinhala_query = convert_to_sinhala(query)
    except:
        sinhala_query = ""

    # Generate phonetic root for the incoming query
    encoded_query = phonetic_encode(query)

    def field_contains(book, text):
        if not text:
            return False
        fields = [
            book.get("title", ""),
            book.get("author", ""),
            book.get("category", ""),
        ]
        tags = book.get("search_tags", "")
        if isinstance(tags, list):
            tags = " ".join(tags)
        fields.append(tags)

        return any(is_fuzzy_match(text, field) for field in fields if field)

    # 1. Exact Substring Match
    for book in all_books:
        title = book.get("title", "")
        sinhala_match = sinhala_query and field_contains(book, sinhala_query)
        english_match = field_contains(book, query)

        if sinhala_match or english_match:
            matched_book = {k: v for k, v in book.items() if not k.startswith("_")}
            matched_book["match_type"] = "Exact Substring Match"
            results.append(matched_book)
            seen_titles.add(title)

    # 2. Custom Phonetic Root Match (Using Pre-computed hashes)
    if encoded_query:
        for book in all_books:
            title = book.get("title", "")
            if title in seen_titles:
                continue
                
            encoded_title = book.get("_encoded_title", "")
            if encoded_query in encoded_title or difflib.SequenceMatcher(None, encoded_query, encoded_title).ratio() > 0.8:
                matched_book = {k: v for k, v in book.items() if not k.startswith("_")}
                matched_book["match_type"] = "Phonetic Root Match"
                results.append(matched_book)
                seen_titles.add(title)

    # 3. Fuzzy Direct Text Match
    query_lower = query.lower()
    sinhala_lower = sinhala_query.lower() if sinhala_query else ""

    for book in all_books:
        title = book.get("title", "")
        if title in seen_titles:
            continue
            
        title_lower = title.lower()
        
        # Check English query
        score = 1.0 if query_lower in title_lower else difflib.SequenceMatcher(None, query_lower, title_lower).ratio()
        if score > 0.6:
            matched_book = {k: v for k, v in book.items() if not k.startswith("_")}
            matched_book["match_type"] = "Fuzzy Direct Match"
            results.append(matched_book)
            seen_titles.add(title)
            continue

        # Check Sinhala query
        if sinhala_lower:
            score_sin = 1.0 if sinhala_lower in title_lower else difflib.SequenceMatcher(None, sinhala_lower, title_lower).ratio()
            if score_sin > 0.6:
                matched_book = {k: v for k, v in book.items() if not k.startswith("_")}
                matched_book["match_type"] = "Fuzzy Normalized Match"
                results.append(matched_book)
                seen_titles.add(title)

    # 4. Dual-Hash Acoustic Strategy (Using Pre-computed Soundex)
    hash_a_full = sinhala_soundex(query)
    hash_b_full = sinhala_soundex(sinhala_query) if sinhala_query else ""
    hash_a_stripped = hash_a_full.rstrip('0')
    hash_b_stripped = hash_b_full.rstrip('0') if hash_b_full else ""

    for book in all_books:
        title = book.get("title", "")
        if title in seen_titles:
            continue
            
        title_hash = book.get("_soundex_title", "")
        matched = False
        match_reason = ""
        
        # A. Exact Acoustic Match 
        if title_hash in [hash_a_full, hash_b_full] and title_hash != "00000":
            match_reason = "Acoustic Match"
            matched = True
            
        # B. Prefix Acoustic Match 
        if not matched:
            for q_stripped in [hash_a_stripped, hash_b_stripped]:
                if q_stripped and len(q_stripped) >= 2 and title_hash.startswith(q_stripped):
                    match_reason = "Acoustic Prefix Match"
                    matched = True
                    break
            
        # C. Word-by-Word Acoustic Match (Using Pre-computed word hashes)
        if not matched:
            for word_hash in book.get("_soundex_words", []):
                if word_hash in [hash_a_full, hash_b_full] and word_hash != "00000":
                    match_reason = "Partial Acoustic Match"
                    matched = True
                    break
                    
                for q_stripped in [hash_a_stripped, hash_b_stripped]:
                    if q_stripped and len(q_stripped) >= 2 and word_hash.startswith(q_stripped):
                        match_reason = "Partial Acoustic Match"
                        matched = True
                        break
                if matched:
                    break

        if matched:
            matched_book = {k: v for k, v in book.items() if not k.startswith("_")}
            matched_book["match_type"] = match_reason
            results.append(matched_book)
            seen_titles.add(title)

    return results