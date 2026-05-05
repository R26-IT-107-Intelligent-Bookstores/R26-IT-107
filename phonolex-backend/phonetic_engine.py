import re

def normalize_singlish(text):
    if not text:
        return ""
        
    text = text.strip().lower()

    # 1. වචන මට්ටමින් ඇති පොදු වැරදි නිවැරදි කිරීම (Singlish Typos)
    # \b යොදාගෙන ඇත්තේ සම්පූර්ණ වචනයක්ම පමණක් වෙනස් වීමටයි (Word boundary)
    corrections = {
        r'\bmei\b': 'mayi',
        r'\bmay\b': 'mayi',
        r'\bmara\b': 'maara',
        r'\bkrnwa\b': 'karanawa',
        r'\bthmai\b': 'thamai',
    }
    for wrong, correct in corrections.items():
        text = re.sub(wrong, correct, text)

    # 2. අකුරු අඩු වී ටයිප් කිරීම් හැදීම (Missing vowels correction)
    text = text.replace("sng", "sang")
    text = text.replace("kth", "kath") 
    text = text.replace("thw", "thaw") 

    return text

def convert_to_sinhala(singlish_text):
    # 1. පූර්ව සැකසුම (Normalization)
    text = normalize_singlish(singlish_text)
    
    special_words = special_words = {
        r'\bmai\b': 'මැයි',
        r'\bmayi\b': 'මැයි',
        r'\bmey\b': 'මේ',
        r'\bamba\b': 'අඹ',
        r'\bumba\b': 'උඹ/අඹ',
        r'\buba\b': 'උඹ/අඹ',
        r'\bambe\b': 'අඹේ',
        r'\bwikurthi\b': 'විකෘති',
        r'\bvikurthi\b': 'විකෘති',
        r'\bwikruthi\b': 'විකෘති',
        r'\bvikruthi\b': 'විකෘති',
        r'\bvikuti\b': 'විකෘති',
        r'\bwikuthi\b': 'විකෘති',
        r'\bgndara\b': 'ගන්දර',
        r'\bgandara\b': 'ගන්දර',
        r'\bkalapuwa\b': 'කලපුව',
        r'\bsmidano\b': 'සමිදාණෝ',

    }
    for eng, sin in special_words.items():
        text = re.sub(eng, sin, text)

    # 3. දිගු ස්වර (Vowels) සහ ඒවායේ පිළිලි (Modifiers)
    vowel_modifiers = {
        'aae': 'ෑ', 'ae': 'ැ', 
        'aa': 'ා', 'a': '', 
        'ii': 'ී', 'i': 'ි', 
        'uu': 'ූ', 'u': 'ු', 
        'ee': 'ේ', 'e': 'ෙ', 
        'oo': 'ෝ', 'o': 'ො',
        'ou': 'ෞ'
    }

    # 4. තනිව යෙදෙන ස්වර (වචනයක් මුලදී එනවා නම්)
    independent_vowels = {
        'aae': 'ඈ', 'ae': 'ඇ', 
        'aa': 'ආ', 'a': 'අ', 
        'ii': 'ඊ', 'i': 'ඉ', 
        'uu': 'ඌ', 'u': 'උ', 
        'ee': 'ඒ', 'e': 'එ', 
        'oo': 'ඕ', 'o': 'ඔ',
        'ou': 'ඖ'
    }

    # 5. සංකීර්ණ ව්‍යාංජනාක්ෂර (Complex Consonants)
    complex_consonants = {
        'nnd': 'ඳ', 'nng': 'ඟ', 'mmb': 'ඹ',
        'mb': 'ඹ', 'nd': 'ඳ', 'ng': 'ඟ',
        'ksh': 'ක්‍ෂ', 
        'sh': 'ෂ', 'ch': 'ච', 'dh': 'ධ', 'th': 'ථ', 'bh': 'භ', 'gh': 'ඝ', 'ph': 'ඵ',
        'ny': 'ඤ', 'gn': 'ඥ', 'kn': 'ඥ'
    }

    # 6. සරල ව්‍යාංජනාක්ෂර (Base Consonants)
    base_consonants = {
        'k': 'ක', 'g': 'ග', 't': 'ට', 'd': 'ඩ', 'n': 'න', 'p': 'ප', 'b': 'බ', 
        'm': 'ම', 'y': 'ය', 'r': 'ර', 'l': 'ල', 'v': 'ව', 'w': 'ව', 's': 'ස', 
        'h': 'හ', 'j': 'ජ', 'f': 'ෆ', 'c': 'ක'
    }

    # 7. පරිවර්තන ක්‍රියාවලිය (Replacement Process)
    combined_map = {**complex_consonants, **base_consonants}
    
    # 7.1 මුලින්ම ව්‍යාංජන + ස්වර සංයෝජන හොයලා මාරු කරනවා
    for eng_c, sin_c in combined_map.items():
        for eng_v, sin_v in vowel_modifiers.items():
            text = text.replace(eng_c + eng_v, sin_c + sin_v)
            
    # 7.2 ඉතුරු වෙන ව්‍යාංජනාක්ෂර වලට හල්කිරිම (්) දානවා
    for eng_c, sin_c in combined_map.items():
        text = text.replace(eng_c, sin_c + '්')

    # 7.3 ඉතුරු වෙලා තියෙන තනි ස්වර මාරු කරනවා
    for eng_v, sin_v in independent_vowels.items():
        text = text.replace(eng_v, sin_v)

    return text

# පරීක්ෂා කරමු
if __name__ == "__main__":
    test_words = ["mei mara prasngaya", "mai", "may", "potha", "sinhala", "amma", "aadarayai"]
    for word in test_words:
        # දැන් ප්‍රධානම function එක වෙන්නේ convert_to_sinhala යන්නයි.
        print(f"{word} -> {convert_to_sinhala(word)}")