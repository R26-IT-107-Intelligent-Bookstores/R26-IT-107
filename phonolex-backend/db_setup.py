from pymongo import MongoClient
import re

def setup_database():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["phonolex_db"]
        books_collection = db["books"]
        books_collection.delete_many({})
        
        books_to_insert = []
        
        with open("books.txt", "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                # පේළියේ ඉරක් තිබේ නම් පමණක් සලකා බලයි
                if '-' in line or '–' in line:
                    parts = re.split(r'[-–]', line)
                    if len(parts) >= 2:
                        books_to_insert.append({
                            "title": parts[0].strip(),
                            "author": parts[1].strip()
                        })
        
        if books_to_insert:
            books_collection.insert_many(books_to_insert)
            print(f"✅ Success! Books inserted: {len(books_to_insert)}")
        else:
            print("❌ No books found in file! Check if you have '-' between book and author.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_database()