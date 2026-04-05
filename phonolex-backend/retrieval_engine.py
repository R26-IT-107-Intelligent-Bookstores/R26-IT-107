from pymongo import MongoClient
from soundex_engine import sinhala_soundex
from phonetic_engine import normalize_singlish
import difflib
import re  # මේක අලුතෙන් එකතු කළා (Regular Expressions සඳහා)

def get_data():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["phonolex_db"]
        books = list(db["books"].find({}, {"_id": 0, "title": 1}))
        return [b["title"] for b in books]
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return []

def acoustic_match(query):
    all_titles = get_data()
    results = []
    seen_titles = set()

    # Normalize the query to Sinhala for accurate substring matching
    try:
        normalized_query = normalize_singlish(query)
    except:
        normalized_query = ""

    # 1. Exact Substring Match (Highest Priority) - දැන් "Housemaid" ප්‍රශ්නය විසඳා ඇත
    for title in all_titles:
        # සිංහලෙන් ගැලපෙනවාද බලනවා (උදා: "මැයි" කියන එක "මැයි මාර ප්‍රසංගය" තුළ තිබේද)
        sinhala_match = normalized_query and normalized_query in title
        
        # ඉංග්‍රීසියෙන් ගැලපෙනවාද බලනවා (හැබැයි තනි වචනයක් විදිහට විතරයි. 'mai' මිසක් 'housemaid' ඇතුළේ නෙමෙයි)
        english_match = bool(re.search(r'\b' + re.escape(query.lower()) + r'\b', title.lower()))
        
        if sinhala_match or english_match:
            results.append(f"{title} (Exact Substring Match)")
            seen_titles.add(title)

    # 2. Fuzzy Direct Text Match
    direct_matches = difflib.get_close_matches(query, all_titles, n=3, cutoff=0.6)
    for m in direct_matches:
        if m not in seen_titles:
            results.append(f"{m} (Fuzzy Direct Match)")
            seen_titles.add(m)
            
    if normalized_query:
        fuzzy_norm_matches = difflib.get_close_matches(normalized_query, all_titles, n=3, cutoff=0.6)
        for m in fuzzy_norm_matches:
            if m not in seen_titles:
                results.append(f"{m} (Fuzzy Normalized Match)")
                seen_titles.add(m)

    # 3. Dual-Hash Acoustic Strategy (Full vs Normalized)
    hash_a_full = sinhala_soundex(query)
    hash_b_full = sinhala_soundex(normalized_query) if normalized_query else ""
        
    hash_a_stripped = hash_a_full.rstrip('0')
    hash_b_stripped = hash_b_full.rstrip('0') if hash_b_full else ""

    for title in all_titles:
        if title in seen_titles:
            continue
            
        title_hash = sinhala_soundex(title)
        matched = False
        
        # A. Exact Acoustic Match 
        if title_hash in [hash_a_full, hash_b_full] and title_hash != "00000":
            results.append(f"{title} (Acoustic Match)")
            seen_titles.add(title)
            continue
            
        # B. Prefix Acoustic Match 
        for q_stripped in [hash_a_stripped, hash_b_stripped]:
            if q_stripped and len(q_stripped) >= 2 and title_hash.startswith(q_stripped):
                results.append(f"{title} (Acoustic Prefix Match)")
                seen_titles.add(title)
                matched = True
                break
                
        if matched:
            continue
        
        # C. Word-by-Word Acoustic Match
        for word in title.split():
            word_hash = sinhala_soundex(word)
            
            if word_hash in [hash_a_full, hash_b_full] and word_hash != "00000":
                results.append(f"{title} (Partial Acoustic Match)")
                seen_titles.add(title)
                matched = True
                break
                
            for q_stripped in [hash_a_stripped, hash_b_stripped]:
                if q_stripped and len(q_stripped) >= 2 and word_hash.startswith(q_stripped):
                    results.append(f"{title} (Partial Acoustic Match)")
                    seen_titles.add(title)
                    matched = True
                    break
                    
            if matched:
                break

    return results if results else ["No matching books found."]