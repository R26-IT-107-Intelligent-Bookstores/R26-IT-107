# phonolex-backend/db_migrator.py

import json
import random
from pymongo import MongoClient
import os

def generate_book_data():
    # 1. Read the Txt file (path to your books.txt file)
    txt_file_path = "books.txt"
    
    if not os.path.exists(txt_file_path):
        print(f"❌ Error: Cannot find the '{txt_file_path}' file!")
        return []

    with open(txt_file_path, "r", encoding="utf-8") as file:
        # Remove empty lines and extract book titles
        book_titles = [line.strip() for line in file.readlines() if line.strip()]

    # Sinhala Data lists for the Frontend UI
    authors = ["මාර්ටින් වික්‍රමසිංහ", "සුජීව ප්‍රසන්න ආරච්චි", "මහගම සේකර", "ටී. බී. ඉලංගරත්න", "චන්දිමාල් සේනානායක"]
    categories = ["නවකතා", "ළමා කතා", "පරිවර්තන", "කෙටිකතා", "ත්‍රාසජනක"]

    formatted_books = []
    
    # 2. Create a professional JSON structure for each book
    for index, title in enumerate(book_titles, start=1):
        book_doc = {
            "book_id": f"BK-{index:04d}", # e.g., BK-0001, BK-0002
            "title": title,
            "author": random.choice(authors), # Random Sinhala author
            "category": random.choice(categories), # Random Sinhala category
            "price": random.choice([350.0, 450.0, 500.0, 650.0, 800.0, 1200.0]),
            "cover_image_url": f"/images/books/placeholder.jpg",
            "in_stock": True,
            # Create search tags to optimize the retrieval engine
            "search_tags": [title] + title.split() 
        }
        formatted_books.append(book_doc)

    return formatted_books

def migrate_to_database(books_data):
    # 3. Save as a JSON file
    with open("books_dataset.json", "w", encoding="utf-8") as json_file:
        json.dump(books_data, json_file, ensure_ascii=False, indent=4)
    print(f"✅ Success! Data for {len(books_data)} books saved to 'books_dataset.json'.")

    # 4. Insert the structured data into MongoDB
    try:
        # MongoDB connection string
        client = MongoClient("mongodb://localhost:27017/")
        db = client["phonolex_db"]
        collection = db["books"]

        # Clear existing data to prevent duplicates during testing
        collection.delete_many({}) 
        
        if books_data:
            collection.insert_many(books_data)
            print(f"✅ Success! Inserted {len(books_data)} books into the MongoDB 'phonolex_db' database.")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")

if __name__ == "__main__":
    print("🔄 Preparing data migration...")
    books = generate_book_data()
    if books:
        migrate_to_database(books)