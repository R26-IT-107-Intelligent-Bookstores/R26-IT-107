from pymongo import MongoClient
from soundex_engine import sinhala_soundex
from phonetic_engine import normalize_singlish
import difflib
import re

def get_data():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["phonolex_db"]
        # CHANGE 1: Fetch the entire book document, excluding the internal MongoDB '_id'
        books = list(db["books"].find({}, {"_id": 0}))
        return books
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return []

def acoustic_match(query):
    all_books = get_data() # Now this is a list of dictionaries (JSON objects)
    results = []
    seen_titles = set()

    try:
        normalized_query = normalize_singlish(query)
    except:
        normalized_query = ""

    # 1. Exact Substring Match
    for book in all_books:
        title = book["title"]
        sinhala_match = normalized_query and normalized_query in title
        english_match = bool(re.search(r'\b' + re.escape(query.lower()) + r'\b', title.lower()))
        
        if sinhala_match or english_match:
            # CHANGE 2: Return the full book object and attach the match_type to it
            matched_book = book.copy()
            matched_book["match_type"] = "Exact Substring Match"
            results.append(matched_book)
            seen_titles.add(title)

    # Prepare titles list for fuzzy matching
    all_titles = [b["title"] for b in all_books]

    # 2. Fuzzy Direct Text Match
    direct_matches = difflib.get_close_matches(query, all_titles, n=3, cutoff=0.6)
    for m in direct_matches:
        if m not in seen_titles:
            book_obj = next((b for b in all_books if b["title"] == m), None)
            if book_obj:
                matched_book = book_obj.copy()
                matched_book["match_type"] = "Fuzzy Direct Match"
                results.append(matched_book)
                seen_titles.add(m)
            
    if normalized_query:
        fuzzy_norm_matches = difflib.get_close_matches(normalized_query, all_titles, n=3, cutoff=0.6)
        for m in fuzzy_norm_matches:
            if m not in seen_titles:
                book_obj = next((b for b in all_books if b["title"] == m), None)
                if book_obj:
                    matched_book = book_obj.copy()
                    matched_book["match_type"] = "Fuzzy Normalized Match"
                    results.append(matched_book)
                    seen_titles.add(m)

    # 3. Dual-Hash Acoustic Strategy
    hash_a_full = sinhala_soundex(query)
    hash_b_full = sinhala_soundex(normalized_query) if normalized_query else ""
    hash_a_stripped = hash_a_full.rstrip('0')
    hash_b_stripped = hash_b_full.rstrip('0') if hash_b_full else ""

    for book in all_books:
        title = book["title"]
        if title in seen_titles:
            continue
            
        title_hash = sinhala_soundex(title)
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
            
        # C. Word-by-Word Acoustic Match
        if not matched:
            for word in title.split():
                word_hash = sinhala_soundex(word)
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
            matched_book = book.copy()
            matched_book["match_type"] = match_reason
            results.append(matched_book)
            seen_titles.add(title)

    return results