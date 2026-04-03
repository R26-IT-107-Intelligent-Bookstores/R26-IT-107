# phonolex-backend/phonetic_engine.py

def normalize_singlish(text):
    
    if not text:
        return ""
        
    text = text.strip().lower()

    text = text.replace('mai', 'මැයි')
    text = text.replace('may', 'මැයි')

    # 1. මුලින්ම දිගු ස්වර (Vowels) සහ ඒවායේ පිළිලි (Modifiers)
    # අනුපිළිවෙළ වැදගත්: දිගු අකුරු මුලින්ම තියෙන්න ඕනේ.
    vowel_modifiers = {
        'aae': 'ෑ', 'ae': 'ැ', 
        'aa': 'ා', 'a': '', # 'a' වලට වෙනම පිළිල්ලක් නෑ 
        'ii': 'ී', 'i': 'ි', 
        'uu': 'ූ', 'u': 'ු', 
        'ee': 'ේ', 'e': 'ෙ', 
        'oo': 'ෝ', 'o': 'ො',
        'ou': 'ෞ'
    }

    # තනිව යෙදෙන ස්වර (වචනයක් මුලදී එනවා නම්)
    independent_vowels = {
        'aae': 'ඈ', 'ae': 'ඇ', 
        'aa': 'ආ', 'a': 'අ', 
        'ii': 'ඊ', 'i': 'ඉ', 
        'uu': 'ඌ', 'u': 'උ', 
        'ee': 'ඒ', 'e': 'එ', 
        'oo': 'ඕ', 'o': 'ඔ',
        'ou': 'ඖ'
    }

    # 2. සංකීර්ණ ව්‍යාංජනාක්ෂර (Complex Consonants - අකුරු 2, 3ක් තියෙන ඒවා)
    complex_consonants = {
        'nnd': 'ඳ', 'nng': 'ඟ', 'mmb': 'ඹ',
        'ksh': 'ක්‍ෂ', 
        'sh': 'ෂ', 'ch': 'ච', 'dh': 'ධ', 'th': 'ථ', 'bh': 'භ', 'gh': 'ඝ', 'ph': 'ඵ',
        'ny': 'ඤ', 'gn': 'ඥ', 'kn': 'ඥ'
    }

    # 3. සරල ව්‍යාංජනාක්ෂර (Base Consonants)
    base_consonants = {
        'k': 'ක', 'g': 'ග', 't': 'ට', 'd': 'ඩ', 'n': 'න', 'p': 'ප', 'b': 'බ', 
        'm': 'ම', 'y': 'ය', 'r': 'ර', 'l': 'ල', 'v': 'ව', 'w': 'ව', 's': 'ස', 
        'h': 'හ', 'j': 'ජ', 'f': 'ෆ', 'c': 'ක' # C අකුර ගොඩක් වෙලාවට 'ක' ශබ්දයට යෙදේ
    }

    # 4. විශේෂ අවස්ථා - 'mai' සහ 'may' දෙකම 'මැයි' විදිහට හැදෙන්න
    text = text.replace('mai', 'මැයි')
    text = text.replace('may', 'මැයි')
    text = text.replace('mey', 'මේ')

    # 5. පරිවර්තන ක්‍රියාවලිය (Replacement Process)
    # ව්‍යාංජනාක්ෂර + ස්වර (Consonant + Vowel) එකට මාරු කිරීම
    combined_map = {**complex_consonants, **base_consonants}
    
    # 5.1 මුලින්ම ව්‍යාංජන + ස්වර සංයෝජන හොයලා මාරු කරනවා
    for eng_c, sin_c in combined_map.items():
        for eng_v, sin_v in vowel_modifiers.items():
            # උදා: k + aa -> ක + ා (කා)
            text = text.replace(eng_c + eng_v, sin_c + sin_v)
            
    # 5.2 ඉතුරු වෙන ව්‍යාංජනාක්ෂර වලට හල්කිරිම (්) දානවා (ස්වරයක් නැති නිසා)
    for eng_c, sin_c in combined_map.items():
        text = text.replace(eng_c, sin_c + '්')

    # 5.3 ඉතුරු වෙලා තියෙන තනි ස්වර (මුලට එන ඒවා) මාරු කරනවා
    for eng_v, sin_v in independent_vowels.items():
        text = text.replace(eng_v, sin_v)

    return text

# පරීක්ෂා කරමු
if __name__ == "__main__":
    test_words = ["mai", "may", "potha", "sinhala", "amma", "aadarayai"]
    for word in test_words:
        print(f"{word} -> {normalize_singlish(word)}")