import re
from ml_engine import ml_engine

def normalize_singlish(text):
    if not text:
        return ""
        
    text = text.strip().lower()

    
    corrections = {
        r'\bmei\b': 'mayi',
        r'\bmay\b': 'mayi',
        r'\bmara\b': 'maara',
        r'\bkrnwa\b': 'karanawa',
        r'\bthmai\b': 'thamai',
    }
    for wrong, correct in corrections.items():
        text = re.sub(wrong, correct, text)

    # 2.(Missing vowels correction)
    text = text.replace("sng", "sang")
    text = text.replace("kth", "kath") 
    text = text.replace("thw", "thaw") 

    return text

def convert_to_sinhala(singlish_text):
    special_words = {
        r'\bmai\b': 'මැයි',
        r'\bwickramasinghe\b': 'වික්‍රමසිංහ',
        r'\bwikramasinha\b': 'වික්‍රමසිංහ',
        r'\bwikkramasinha\b': 'වික්‍රමසිංහ',
        
    }

    def translate_word(word):
        text = normalize_singlish(word)

        for eng, sin in special_words.items():
            if re.fullmatch(eng, text):
                print(f"ML Hybrid: using special word mapping for '{text}' -> '{sin}'")
                return sin

        ml_prediction = None
        try:
            ml_prediction = ml_engine.predict_sinhala(text)
        except Exception as e:
            print(f"ML Hybrid: ML prediction failed for '{text}': {e}")

        if ml_prediction and ml_prediction.strip():
            print(f"ML Hybrid: ML prediction used for '{text}' -> '{ml_prediction.strip()}'")
            return ml_prediction.strip()

        # Rule-based fallback only when ML does not return a usable result
        for eng, sin in special_words.items():
            text = re.sub(eng, sin, text)

        vowel_modifiers = {
            'aae': 'ෑ', 'ae': 'ැ',
            'aa': 'ා', 'a': '',
            'ii': 'ී', 'i': 'ි',
            'uu': 'ූ', 'u': 'ු',
            'ee': 'ේ', 'e': 'ෙ',
            'oo': 'ෝ', 'o': 'ො',
            'ou': 'ෞ'
        }

        independent_vowels = {
            'aae': 'ඈ', 'ae': 'ඇ',
            'aa': 'ආ', 'a': 'අ',
            'ii': 'ඊ', 'i': 'ඉ',
            'uu': 'ඌ', 'u': 'උ',
            'ee': 'ඒ', 'e': 'එ',
            'oo': 'ඕ', 'o': 'ඔ',
            'ou': 'ඖ'
        }

        complex_consonants = {
            'nnd': 'ඳ', 'nng': 'ඟ', 'mmb': 'ඹ',
            'mb': 'ඹ', 'nd': 'ඳ', 'ng': 'ඟ',
            'ksh': 'ක්‍ෂ',
            'sh': 'ෂ', 'ch': 'ච', 'dh': 'ධ', 'th': 'ථ', 'bh': 'භ', 'gh': 'ඝ', 'ph': 'ඵ',
            'ny': 'ඤ', 'gn': 'ඥ', 'kn': 'ඥ'
        }

        base_consonants = {
            'k': 'ක', 'g': 'ග', 't': 'ට', 'd': 'ඩ', 'n': 'න', 'p': 'ප', 'b': 'බ',
            'm': 'ම', 'y': 'ය', 'r': 'ර', 'l': 'ල', 'v': 'ව', 'w': 'ව', 's': 'ස',
            'h': 'හ', 'j': 'ජ', 'f': 'ෆ', 'c': 'ක'
        }

        combined_map = {**complex_consonants, **base_consonants}

        for eng_c, sin_c in combined_map.items():
            for eng_v, sin_v in vowel_modifiers.items():
                text = text.replace(eng_c + eng_v, sin_c + sin_v)

        for eng_c, sin_c in combined_map.items():
            text = text.replace(eng_c, sin_c + '්')

        for eng_v, sin_v in independent_vowels.items():
            text = text.replace(eng_v, sin_v)

        return text

    words = singlish_text.split()
    translated_words = [translate_word(word) for word in words]
    return " ".join(translated_words)


if __name__ == "__main__":
    test_words = ["mei mara prasngaya", "mai", "may", "potha", "sinhala", "amma", "aadarayai"]
    for word in test_words:
        
        print(f"{word} -> {convert_to_sinhala(word)}")