import re
import itertools
from functools import lru_cache
from ml_engine import ml_engine

def normalize_singlish(text):
    if not text:
        return ""
    text = text.strip().lower()

    # 1. Common Singlish typos and variations correction
    corrections = {
        r'\bmei\b': 'mayi',
        r'\bmay\b': 'mayi',
        r'\bmara\b': 'maara',
        r'\bkrnwa\b': 'karanawa',
        r'\bthmai\b': 'thamai',
    }
    for wrong, correct in corrections.items():
        text = re.sub(wrong, correct, text)

    # 2. Missing vowels correction
    text = text.replace("sng", "sang")
    text = text.replace("kth", "kath") 
    text = text.replace("thw", "thaw") 

    return text

# =========================================================
# PURE RULE-BASED ENGINE (100% Fallback Reliability)
# =========================================================
def pure_rule_based_translate(singlish_text):
    """
    Strictly translates using characters and rules. No ML involved here.
    This guarantees that every word gets a valid Sinhala output.
    """
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
                return sin

        for eng, sin in special_words.items():
            text = re.sub(eng, sin, text)

        vowel_modifiers = {
            'aae': 'ෑ', 'ae': 'ැ', 'aa': 'ා', 'a': '',
            'ii': 'ී', 'i': 'ි', 'uu': 'ූ', 'u': 'ු',
            'ee': 'ේ', 'e': 'ෙ', 'oo': 'ෝ', 'o': 'ො', 'ou': 'ෞ'
        }

        independent_vowels = {
            'aae': 'ඈ', 'ae': 'ඇ', 'aa': 'ආ', 'a': 'අ',
            'ii': 'ඊ', 'i': 'ඉ', 'uu': 'ඌ', 'u': 'උ',
            'ee': 'ඒ', 'e': 'එ', 'oo': 'ඕ', 'o': 'ඔ', 'ou': 'ඖ'
        }

        complex_consonants = {
            'nnd': 'ඳ', 'nng': 'ඟ', 'mmb': 'ඹ', 'mb': 'ඹ', 'nd': 'ඳ', 'ng': 'ඟ',
            'ksh': 'ක්‍ෂ', 'sh': 'ෂ', 'ch': 'ච', 'dh': 'ධ', 'th': 'ථ', 'bh': 'භ', 'gh': 'ඝ', 'ph': 'ඵ',
            'ny': 'ඤ', 'gn': 'ඥ', 'kn': 'ඥ'
        }

        base_consonants = {
            'k': 'ක', 'g': 'ග', 't': 'ට', 'd': 'ඩ', 'n': 'න', 'p': 'ප', 'b': 'බ',
            'm': 'ම', 'y': 'ය', 'r': 'ර', 'l': 'ල', 'v': 'ව', 'w': 'ව', 's': 'ස',
            'h': 'හ', 'j': 'ජ', 'f': 'ෆ', 'c': 'ක'
        }

        combined_map = {**complex_consonants, **base_consonants}

        # Apply mapping
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


# =========================================================
# HYBRID SUGGESTION ENGINE (ML + Rule-based)
# =========================================================
@lru_cache(maxsize=1024)
def get_sinhala_suggestions(singlish_text, num_suggestions=3):
    """
    Returns top Sinhala suggestions by combining Rule-based translation + ML Beam Search.
    Cached using LRU cache to reduce redundant heavy predictions.
    """
    words = singlish_text.split()
    all_word_suggestions = []

    for word in words:
        text = normalize_singlish(word)
        
        # 1. Get Rule-based Translation (Highly accurate for unseen words)
        rule_based_word = pure_rule_based_translate(word)

        # 2. Get ML Beam Search Suggestions
        ml_suggestions = []
        try:
            ml_suggestions = ml_engine.predict_sinhala_beam_search(text, beam_width=num_suggestions)
        except Exception:
            pass
        
        # 3. Combine Both logically
        word_options = []
        
        # Priority 1: Always include the Rule-Based word first to prevent blank/garbage outputs
        if rule_based_word:
            word_options.append(rule_based_word)
            
        # Priority 2: Add valid ML suggestions as alternative options
        for sugg in ml_suggestions:
            if sugg and sugg not in word_options:
                # Filter out garbage ML outputs (e.g., single characters for long inputs)
                if len(sugg) > 1 or len(word) <= 2:
                    word_options.append(sugg)

        # Fallback if everything is empty
        if not word_options:
            word_options = [word]

        all_word_suggestions.append(word_options[:num_suggestions])

    # Generate combinations of suggestions for multi-word phrases
    combinations = list(itertools.product(*all_word_suggestions))
    
    # Format as list of strings
    suggestions = [" ".join(combo) for combo in combinations]
    
    # Remove duplicates while preserving order
    unique_suggestions = list(dict.fromkeys(suggestions))
    
    return unique_suggestions[:num_suggestions]

# =========================================================
# SINGLE BEST TRANSLATION (Used by api.py for searching)
# =========================================================
@lru_cache(maxsize=1024)
def convert_to_sinhala(singlish_text):
    """
    Gets the absolute best translation by picking the top suggestion 
    from our Hybrid Suggestion Engine. Cached for instantaneous search retrieval.
    """
    suggestions = get_sinhala_suggestions(singlish_text, num_suggestions=1)
    if suggestions and len(suggestions) > 0:
        return suggestions[0]
    return singlish_text


if __name__ == "__main__":
    test_phrase = "suwada"
    print(f"\n--- Testing Phrase Suggestions for: '{test_phrase}' ---")
    suggestions = get_sinhala_suggestions(test_phrase, num_suggestions=3)
    print(f"Suggestions List: {suggestions}\n")