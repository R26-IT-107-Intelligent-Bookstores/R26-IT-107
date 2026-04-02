from pymongo import MongoClient
from soundex_engine import sinhala_soundex
from phonetic_engine import normalize_singlish
import difflib

def get_data():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["phonolex_db"]
        books = list(db["books"].find({}, {"_id": 0, "title": 1}))
        return [b["title"] for b in books]
    except Exception as e:
        print(f"Error: {e}")
        return []

def acoustic_match(query):
    all_titles = get_data()
    results = []
    seen_titles = set()

    # 1. Direct Text Match
    direct_matches = difflib.get_close_matches(query, all_titles, n=3, cutoff=0.6)
    for m in direct_matches:
        if m not in seen_titles:
            results.append(f"{m} (Direct Match)")
            seen_titles.add(m)

    # 2. Dual-Hash Strategy (Full vs Stripped)
    hash_a_full = sinhala_soundex(query)
    try:
        hash_b_full = sinhala_soundex(normalize_singlish(query))
    except:
        hash_b_full = ""
        
    # Stripped Hashes (අග බිංදු ඉවත් කළ Hashes - මේවා Partial Match සඳහා පමණි)
    hash_a_stripped = hash_a_full.rstrip('0')
    hash_b_stripped = hash_b_full.rstrip('0') if hash_b_full else ""

    for title in all_titles:
        if title in seen_titles:
            continue
            
        title_hash = sinhala_soundex(title)
        matched = False
        
        # A. සම්පූර්ණ නම ගැළපීම (Exact Match - දිග ගැන ප්‍රශ්නයක් නැත)
        if title_hash in [hash_a_full, hash_b_full] and title_hash != "00000":
            results.append(f"{title} (Acoustic Match)")
            seen_titles.add(title)
            continue
            
        # B. Prefix ගැළපීම (Anti-spam filter එක මෙතැනට පමණක් සීමා කර ඇත)
        for q_stripped in [hash_a_stripped, hash_b_stripped]:
            if q_stripped and len(q_stripped) >= 2 and title_hash.startswith(q_stripped):
                results.append(f"{title} (Acoustic Match)")
                seen_titles.add(title)
                matched = True
                break
                
        if matched:
            continue
        
        # C. වචනයෙන් වචනය ගැළපීම
        for word in title.split():
            word_hash = sinhala_soundex(word)
            
            # වචනයක Exact Match එකක් නම්
            if word_hash in [hash_a_full, hash_b_full] and word_hash != "00000":
                results.append(f"{title} (Partial Acoustic Match)")
                seen_titles.add(title)
                matched = True
                break
                
            # වචනයක Prefix Match එකක් නම්
            for q_stripped in [hash_a_stripped, hash_b_stripped]:
                if q_stripped and len(q_stripped) >= 2 and word_hash.startswith(q_stripped):
                    results.append(f"{title} (Partial Acoustic Match)")
                    seen_titles.add(title)
                    matched = True
                    break
                    
            if matched:
                break

    return results if results else ["No matching books found."]