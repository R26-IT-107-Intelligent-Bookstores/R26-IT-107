import pandas as pd
import random

# Input and output file paths
input_csv = "phonolex_dataset.csv" 
output_csv = "augmented_phonolex_dataset.csv"

# Typo rules for data augmentation
typo_rules = {
    'da': ['de', 'd', 'dha'],
    'wa': ['va'],
    'sh': ['s'],
    'th': ['t'],
    'oo': ['u'],
    'ee': ['i']
}

def apply_typos(word, num_variations=3):
    variations = set([word])
    for _ in range(num_variations * 2):
        new_word = word
        for target, replacements in typo_rules.items():
            if target in new_word and random.random() > 0.5:
                replacement = random.choice(replacements)
                new_word = new_word.replace(target, replacement, 1)
        variations.add(new_word)
    return list(variations)

print("⏳ Starting data augmentation process...")

try:
    df = pd.read_csv(input_csv)
    augmented_data = []

    for index, row in df.iterrows():
        singlish_word = str(row['singlish']).lower()
        sinhala_word = row['sinhala']
        
        variations = apply_typos(singlish_word)
        for v in variations:
            augmented_data.append({'singlish': v, 'sinhala': sinhala_word})

    new_df = pd.DataFrame(augmented_data)
    new_df.to_csv(output_csv, index=False)

    print(f"✅ Success! Original rows: {len(df)}. Augmented rows: {len(new_df)}.")
    print(f"📁 New dataset saved as: {output_csv}")

except FileNotFoundError:
    print(f"❌ Error: '{input_csv}' not found. Please ensure the file exists in the backend directory.")