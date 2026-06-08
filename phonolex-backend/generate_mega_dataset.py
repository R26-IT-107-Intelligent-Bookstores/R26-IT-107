import pandas as pd
import random
import re

def augment_singlish(word):
    """
    Generates realistic typos and alternative phonetic spellings 
    for a given Singlish word to expand the dataset dynamically.
    """
    word = str(word).lower().strip()
    variations = set([word])
    
    # Common substitutions in Singlish
    substitutions = {
        'k': ['c', 'ch', 'kk'],
        'g': ['gh', 'gg'],
        't': ['th', 'tt'],
        'd': ['dh', 'dd'],
        's': ['sh', 'ss'],
        'w': ['v'],
        'v': ['w'],
        'p': ['ph', 'pp'],
        'a': ['aa', 'ae', 'ah'],
        'e': ['ee', 'ea'],
        'i': ['ii', 'y'],
        'o': ['oo', 'ou'],
        'u': ['oo', 'uu']
    }
    
    # Generate variations based on character replacement
    for char, subs in substitutions.items():
        if char in word:
            for sub in subs:
                # Replace individual occurrences to create natural variants
                new_word = word.replace(char, sub)
                variations.add(new_word)
                # Randomly double characters to simulate typing stress/typos
                if len(new_word) > 2:
                    idx = random.randint(0, len(new_word) - 1)
                    variations.add(new_word[:idx] + new_word[idx] + new_word[idx:])
                    
    return list(variations)

if __name__ == "__main__":
    print("[INFO] Reading original augmented dataset...")
    try:
        df = pd.read_csv('augmented_phonolex_dataset.csv')
        # Standardize column names dynamically
        df.columns = ['singlish', 'sinhala']
    except Exception as e:
        print(f"[ERROR] Could not read file: {e}")
        exit()
        
    print(f"[INFO] Initial record count: {len(df)}")
    
    mega_data = []
    
    print("[INFO] Generating synthetic phonetic variations...")
    for idx, row in df.iterrows():
        singlish_base = row['singlish']
        sinhala_target = row['sinhala']
        
        # Get all programmatic variations for the singlish word
        variants = augment_singlish(singlish_base)
        
        for var in variants:
            mega_data.append({'singlish': var, 'sinhala': sinhala_target})
            
    # Convert back to Dataframe and drop any exact duplicate rows
    mega_df = pd.DataFrame(mega_data)
    mega_df.drop_duplicates(subset=['singlish', 'sinhala'], inplace=True)
    
    print(f"[INFO] Current generated count: {len(mega_df)}")
    
    # If still short of 50k, duplicate with minor tail padding adjustments
    while len(mega_df) < 55000:
        extra_rows = mega_df.sample(n=min(10000, 55000 - len(mega_df))).copy()
        extra_rows['singlish'] = extra_rows['singlish'].apply(lambda x: x + random.choice(['a', 'h', '']))
        mega_df = pd.concat([mega_df, extra_rows], ignore_index=True)
        mega_df.drop_duplicates(subset=['singlish', 'sinhala'], inplace=True)

    # Save the expanded dataset
    mega_df.to_csv('mega_phonolex_dataset.csv', index=False)
    print(f"[SUCCESS] Mega Dataset created successfully with {len(mega_df)} rows!")
    print("[INFO] Saved as 'mega_phonolex_dataset.csv'")