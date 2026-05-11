from pymongo import MongoClient
from soundex_engine import sinhala_soundex
# 1: convert_to_sinhala import 
from phonetic_engine import convert_to_sinhala 
import difflib
import re

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


def get_data():
    try:
        client = MongoClient("mongodb+srv://nirmanichethana02_db_user:Nirmani%21%21%40%40206@cluster0.kb5tqe6.mongodb.net/?appName=Cluster0")
        db = client["phonolex_db"]
        books = list(db["books"].find({}, {"_id": 0}))
        return books
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return []

def acoustic_match(query):
    all_books = get_data() 
    results = []
    seen_titles = set()

    try:
        
        sinhala_query = convert_to_sinhala(query)
    except:
        sinhala_query = ""

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
            matched_book = book.copy()
            matched_book["match_type"] = "Exact Substring Match"
            results.append(matched_book)
            seen_titles.add(title)

    all_titles = [b.get("title", "") for b in all_books]

    # 2. Fuzzy Direct Text Match
    for title in all_titles:
        if title in seen_titles:
            continue
        score = difflib.SequenceMatcher(None, query.lower(), title.lower()).ratio()
        if query.lower() in title.lower():
            score = 1.0
        if score > 0.6:
            book_obj = next((b for b in all_books if b["title"] == title), None)
            if book_obj:
                matched_book = book_obj.copy()
                matched_book["match_type"] = "Fuzzy Direct Match"
                results.append(matched_book)
                seen_titles.add(title)
            
    if sinhala_query:
        for title in all_titles:
            if title in seen_titles:
                continue
            score = difflib.SequenceMatcher(None, sinhala_query.lower(), title.lower()).ratio()
            if sinhala_query.lower() in title.lower():
                score = 1.0
            if score > 0.6:
                book_obj = next((b for b in all_books if b["title"] == title), None)
                if book_obj:
                    matched_book = book_obj.copy()
                    matched_book["match_type"] = "Fuzzy Normalized Match"
                    results.append(matched_book)
                    seen_titles.add(title)

    # 3. Dual-Hash Acoustic Strategy
    hash_a_full = sinhala_soundex(query)
    hash_b_full = sinhala_soundex(sinhala_query) if sinhala_query else ""
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