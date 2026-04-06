import json
import random

def generate_mock_db():
    # ඔයා දුන්නු පොත් ලැයිස්තුව (List of dictionaries)
    base_books = [
        {"title": "ටොක්සික්", "author": "මොහාන් රාජ් මඩවල"},
        {"title": "බෝඩිං කතා", "author": "තනුජා ලුම්බිණි තඹවිට"},
        {"title": "ජිප්සි හාර්ට්", "author": "රසික ජයකොඩි"},
        {"title": "නැන්දම්මාගේ ඩයරිය", "author": "කල්පනා කස්තුරිආරච්චි"},
        {"title": "මදුරාවතී නම් තරු රටාව", "author": "ටිම්රාන් කීර්ති"},
        {"title": "නොකියවිය යුතු කතා කිහිපයක්", "author": "සචින්ත ප්‍රමෝද් නාඔටුන්න"},
        {"title": "දේශ බන්දු", "author": "තරිඳු ජයවර්ධන"},
        {"title": "චෙම්මනි", "author": "තරිඳු ජයවර්ධන"},
        {"title": "ආග්‍රා වලව්ව", "author": "ඇලනා මදුරාගොඩ"},
        {"title": "රුද්‍රායු", "author": "ඇලනා මදුරාගොඩ"},
        {"title": "ලෝටස්", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "සැරිසරන්නා", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "සෙපරාදෝ", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "ළතෝනි ඇල්ල", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "ඉන්කා දෙවොල", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "මරණයේ නගරය", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "මරණයේ නියෝගය", "author": "සෞම්‍ය සඳරුවන් ලියනගේ"},
        {"title": "මඩොල් දූව", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "ගම්පෙරළිය", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "විරාගය", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "කලියුගය", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "යුගාන්තය", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "බඹරු ඇවිත්", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "මලගිය ඇත්තෝ", "author": "මාර්ටින් වික්‍රමසිංහ"},
        {"title": "වසන්ත විවාහය", "author": "පියදාස සිරිසේන"},
        {"title": "ඉෂ්ට දේවියා", "author": "පියදාස සිරිසේන"},
        {"title": "මෙධා", "author": "ජී. බී. සේනානායක"},
        {"title": "අවරගිර", "author": "ජී. බී. සේනානායක"},
        {"title": "කුඩ හොරා", "author": "සිබිල් වෙත්තසිංහ"},
        {"title": "කිරිමටියාගේ කතාව", "author": "සිබිල් වෙත්තසිංහ"},
        {"title": "සෙංකොට්ටං", "author": "මහින්ද ප්‍රසාද් මස්ඉඹුල"},
        {"title": "මණික්කාවත", "author": "මහින්ද ප්‍රසාද් මස්ඉඹුල"},
        {"title": "අලිමංකඩ", "author": "නිහාල් ද සිල්වා"},
        {"title": "මගේ ලෝකය", "author": "නලින් ද සිල්වා"},
        {"title": "අයාලේ ගිය සිතක සටහන්", "author": "ටිස්ස අබේසේකර"},
        {"title": "අපරාධ රාජ්‍යයක්", "author": "කසුන් පුස්සැවෙල්ල"},
        {"title": "කොළපාට සමාජයේ අවසානය", "author": "අනුරුද්ධ ප්‍රදීප් කර්ණසූරිය"},
        {"title": "ලක්ෂ්මි", "author": "ඩබ්. ඒ. සිල්වා"},
        {"title": "කැලෑ හඳ", "author": "ඩබ්. ඒ. සිල්වා"},
        {"title": "විජයබා කොල්ලය", "author": "ඩබ්. ඒ. සිල්වා"},
        {"title": "දෛවයෝගය", "author": "ඩබ්. ඒ. සිල්වා"},
        {"title": "සම්ස් ස්ටෝරි", "author": "එල්මෝ ජයවර්ධන"},
        {"title": "ගොළු හදවත", "author": "කරුණසේන ජයලත්"},
        {"title": "ගැහැනු ළමයි", "author": "කරුණසේන ජයලත්"},
        {"title": "බඹා කෙටූ හැටි", "author": "කරුණාසේන ජයලත්"},
        {"title": "දඩුබස්නා මනස", "author": "එඩිරීවීර සරච්චන්ද්‍ර"},
        {"title": "මනමේ", "author": "එඩිරීවීර සරච්චන්ද්‍ර"},
        {"title": "සිංහබාහු", "author": "එදිරිවීර සරච්චන්ද්‍ර"},
        {"title": "ගඟ අද්දර", "author": "ලියනගේ අමරකීර්ති"},
        {"title": "දේවියෝ සහ භූතයෝ", "author": "ඒබ්‍රහම් ටී. කොවූර්"},
        {"title": "සන්ධ්‍යා", "author": "සුනේත්‍රා රාජකරුණානායක"},
        {"title": "ගිගුම්", "author": "සුනේත්‍රා රාජකරුණානායක"},
        {"title": "අසීමා", "author": "කලුම් වෙලිගම"},
        {"title": "පර්සෝනා", "author": "කලුම් වෙලිගම"},
        {"title": "තුණ්මං හන්දිය", "author": "මහගම සේකර"},
        {"title": "හත්පණ", "author": "මුනිදාස කුමාරතුංග"},
        {"title": "හීන්සැරය", "author": "මුනිදාස කුමාරතුංග"},
        {"title": "මැයි මාර ප්‍රසංගය", "author": "සාරංග දිසානායක"},
        {"title": "ඇටොමික් හැබිට්ස්", "author": "ජේම්ස් ක්ලියර්"},
        {"title": "රිච් ඩෑඩ් පුවර් ඩෑඩ්", "author": "රොබට් ටී. කියෝසාකි"},
        {"title": "හැරී පොටර් සහ මායා ගල", "author": "ජේ. කේ. රෝලිං"},
        {"title": "මහල්ලා සහ මුහුද", "author": "අර්නස්ට් හෙමිංවේ"},
        {"title": "නිමාවක නිල් පැය", "author": "මධාරා අබේසිංහ"},
        {"title": "මරකත පිළිලය", "author": "නෙතිඳු වරාපිටිය"}
    ]

    categories = ["නවකතා", "කෙටිකතා", "පරිවර්තන", "ළමා කතා", "විද්‍යා ප්‍රබන්ධ", "අභිරහස්", "චරිතාපදාන"]
    
    mock_database = []
    base_count = len(base_books)
    target_count = 750

    for i in range(target_count):
        # මුල් පොත් ටික එහෙම්මම ගන්නවා, ඉතුරු ටිකට '2 වැනි කොටස' වගේ කෑල්ලක් දාලා අලුත් පොතක් කරනවා
        if i < base_count:
            book_info = base_books[i]
            title = book_info["title"]
        else:
            book_info = base_books[i % base_count]
            suffix = random.choice(['(2 වැනි කොටස)', '(නව සංස්කරණය)', '(විශේෂ කලාපය)'])
            title = f"{book_info['title']} {suffix}"

        author = book_info["author"]
        price = round(random.uniform(300, 2500), -1) 
        
        book_record = {
            "book_id": f"MOCK-{i+1:04d}",
            "title": title,
            "author": author,
            "category": random.choice(categories),
            "price": float(price),
            "cover_image_url": "/images/books/placeholder.jpg",
            "in_stock": random.choice([True, True, True, False]), 
            "view_count": random.randint(10, 8000), 
            "rating": round(random.uniform(3.0, 5.0), 1),
            "search_tags": [title] + title.split()
        }
        mock_database.append(book_record)

    # JSON එකට සේව් කිරීම
    with open("mock_books_dataset.json", "w", encoding="utf-8") as f:
        json.dump(mock_database, f, ensure_ascii=False, indent=4)

    print(f"✅ සාර්ථකයි! පොත් {len(mock_database)} ක Mock Database එක 'mock_books_dataset.json' නමින් සෑදුවා.")

if __name__ == "__main__":
    generate_mock_db()