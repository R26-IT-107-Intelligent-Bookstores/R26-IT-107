import re

def sinhala_soundex(word):
    if not word: return ""
    word = word.lower()

    first_char_raw = word[0]

    # Vowels සහ පිල්ලම් ඉවත් කිරීම
    clean_word = re.sub(r'[\u0DCA-\u0DDF\u200d\u200c]', '', word)
    clean_word = re.sub(r'[aeiouy]', '', clean_word)
    clean_word = clean_word.replace(" ", "")

    first_char_map = {
        'a': 'අ', 'e': 'එ', 'i': 'ඉ', 'o': 'ඔ', 'u': 'උ', 
        'ආ': 'අ', 'ඇ': 'අ', 'ඈ': 'අ',
        'ඊ': 'ඉ', 'ඌ': 'උ', 
        'ඒ': 'එ', 'ඓ': 'එ',
        'ඕ': 'ඔ', 'ඖ': 'ඔ',
        'k': 'ක', 'g': 'ග', 'q': 'ක', 'c': 'ච', 'j': 'ජ', 'x': 'ච',
        't': 'ත', 'd': 'ද', 'p': 'ප', 'b': 'බ', 'v': 'ව', 'w': 'ව', 'f': 'ෆ',
        'm': 'ම', 'n': 'න', 'r': 'ර', 'l': 'ල', 's': 'ස', 'h': 'හ', 'z': 'ස', 'y': 'ය'
    }

    base_char = first_char_map.get(first_char_raw, first_char_raw)

    if not clean_word:
        return (base_char + "00000")[:5]

    # අංක 8 සඳහා 'ය' අකුර එකතු කර ඇත
    sound_map = {
        '1': ['ක', 'ඛ', 'ග', 'ඝ', 'ඟ', 'k', 'g', 'q', 'c'],
        '2': ['ච', 'ඡ', 'ජ', 'ඣ', 'ඦ', 'j', 'x'],
        '3': ['ට', 'ඨ', 'ඩ', 'ඪ', 'ත', 'ථ', 'ද', 'ධ', 'ඳ', 'ඬ', 't', 'd'],
        '4': ['ප', 'ඵ', 'බ', 'භ', 'ඹ', 'ව', 'ෆ', 'p', 'b', 'v', 'w', 'f'],
        '5': ['ම', 'න', 'ණ', 'ඤ', 'ඥ', 'ඞ', 'ං', 'm', 'n'], 
        '6': ['ර', 'ල', 'ළ', 'r', 'l'],
        '7': ['ස', 'ශ', 'ෂ', 'හ', 's', 'h', 'z'],
        '8': ['ය', 'y']
    }

    char_to_digit = {char: digit for digit, chars in sound_map.items() for char in chars}

    encoded = base_char
    start_idx = 1 if (clean_word[0] == first_char_raw) else 0

    # Nasal Collapse මඟහැරීම සඳහා පරණ නීතිය ඉවත් කර ඇත.
    # දැන් 'maname' යන්න m(5), n(5), m(5) ලෙස නිවැරදිව කේතනය වේ.
    for char in clean_word[start_idx:]:
        digit = char_to_digit.get(char, '')
        if digit:
            encoded += digit

    return (encoded + "00000")[:5]