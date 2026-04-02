def normalize_singlish(text):
    text = text.lower()

    # 1. Complex Combinations
    complex_map = {
        'sh': 'ශ', 'bh': 'භ', 'kh': 'ඛ', 'gh': 'ඝ', 'ph': 'ඵ',
        'th': 'ත', 'dh': 'ද', 'ny': 'ඤ', 'gn': 'ඥ'
    }

    # 2. Base Consonants
    base_map = {
        'k': 'ක', 'g': 'ග', 't': 'ට', 'd': 'ඩ', 'n': 'න',
        'p': 'ප', 'b': 'බ', 'm': 'ම', 'y': 'ය', 'r': 'ර',
        'l': 'ල', 'v': 'ව', 'w': 'ව', 's': 'ස', 'h': 'හ',
        'c': 'ච', 'j': 'ජ'
    }

    # 3. Independent Vowels (a -> අ, i -> ඉ)
    independent_vowels = {
        'aae': 'ඈ', 'ae': 'ඇ', 'aa': 'ආ', 'a': 'අ', 
        'ii': 'ඊ', 'i': 'ඉ', 'uu': 'ඌ', 'u': 'උ', 
        'ee': 'ඒ', 'e': 'එ', 'oo': 'ඕ', 'o': 'ඔ'
    }

    vowel_modifiers = {'aa': 'ා', 'ae': 'ැ', 'ii': 'ී', 'i': 'ි', 'uu': 'ූ', 'u': 'ු', 'ee': 'ේ', 'e': 'ෙ', 'a': ''}

    # Consonants Processing
    combined_map = {**complex_map, **base_map}
    for eng, sin in combined_map.items():
        for v_eng, v_sin in vowel_modifiers.items():
            text = text.replace(eng + v_eng, sin + v_sin)
        text = text.replace(eng, sin + '්')

    # Independent Vowels Processing
    for eng, sin in independent_vowels.items():
        text = text.replace(eng, sin)

    return text