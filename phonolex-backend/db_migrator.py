import json
from pymongo import MongoClient

def migrate_json_to_db():
    try:
        # 1. MongoDB එකට සම්බන්ධ වීම
        client = MongoClient("mongodb://localhost:27017/")
        db = client["phonolex_db"]
        collection = db["books"]
        
        # 2. පරණ වැරදි කසළ දත්ත ඔක්කොම මකා දැමීම (Clean up)
        print("🗑️ පරණ දත්ත මකා දමමින් පවතී...")
        collection.delete_many({})
        
        # 3. අලුත් JSON ෆයිල් එක නිවැරදිව කියවීම
        print("📂 'mock_books_dataset.json' ෆයිල් එක කියවමින් පවතී...")
        with open("mock_books_dataset.json", "r", encoding="utf-8") as file:
            books_data = json.load(file)
        
        # 4. දත්ත ටික Database එකට ඇතුළත් කිරීම
        if isinstance(books_data, list) and len(books_data) > 0:
            collection.insert_many(books_data)
            print(f"✅ සාර්ථකයි! අලුත් පොත් {len(books_data)} ක් Database එකට නිවැරදිව ඇතුළත් කළා.")
        else:
            print("⚠️ JSON ෆයිල් එකේ පොත් කිසිවක් නැත.")
            
    except Exception as e:
        print(f"❌ දෝෂයක් මතු විය: {e}")

if __name__ == "__main__":
    migrate_json_to_db()