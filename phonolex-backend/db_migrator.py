import json
from pymongo import MongoClient

def migrate_json_to_db():
    try:
        # 1. Connecting to MongoDB
        client = MongoClient("mongodb+srv://nirmanichethana02_db_user:Nirmani%21%21%40%40206@cluster0.kb5tqe6.mongodb.net/?appName=Cluster0")
        db = client["phonolex_db"]
        collection = db["books"]
        
        # 2. Deleting all old garbage data (Clean up)
        print("🗑️ Deleting old data...")
        collection.delete_many({})
        
        # 3. Reading the new JSON file correctly (This is where the name was changed)
        print("📂 Reading the 'real_books_dataset.json' file...")
        with open("real_books_dataset.json", "r", encoding="utf-8") as file:
            books_data = json.load(file)
        
        # 4. Inserting the data into the Database
        if isinstance(books_data, list) and len(books_data) > 0:
            collection.insert_many(books_data)
            print(f"✅ Success! Correctly inserted {len(books_data)} new books into the Database.")
        else:
            print("⚠️ No books found in the JSON file.")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    migrate_json_to_db()