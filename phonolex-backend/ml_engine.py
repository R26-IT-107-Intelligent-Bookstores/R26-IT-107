import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import warnings
warnings.filterwarnings('ignore')

# ==========================================
# 1. CUSTOM LAYERS (Required to load the Transformer model)
# ==========================================
class TransformerEncoder(layers.Layer):
    def __init__(self, embed_dim=256, dense_dim=512, num_heads=4, **kwargs):
        super().__init__(**kwargs)
        self.embed_dim = embed_dim
        self.dense_dim = dense_dim
        self.num_heads = num_heads
        self.attention = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.dense_proj = keras.Sequential([
            layers.Dense(dense_dim, activation="relu"),
            layers.Dense(embed_dim),
        ])
        self.layernorm_1 = layers.LayerNormalization()
        self.layernorm_2 = layers.LayerNormalization()

    def call(self, inputs, mask=None):
        if mask is not None:
            mask = mask[:, tf.newaxis, :]
        attention_output = self.attention(inputs, inputs, attention_mask=mask)
        proj_input = self.layernorm_1(inputs + attention_output)
        proj_output = self.dense_proj(proj_input)
        return self.layernorm_2(proj_input + proj_output)

class PositionalEmbedding(layers.Layer):
    def __init__(self, sequence_length=20, vocab_size=100, embed_dim=256, **kwargs):
        super().__init__(**kwargs)
        self.sequence_length = sequence_length
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim
        self.token_embeddings = layers.Embedding(input_dim=vocab_size, output_dim=embed_dim)
        self.position_embeddings = layers.Embedding(input_dim=sequence_length, output_dim=embed_dim)

    def call(self, inputs):
        length = tf.shape(inputs)[-1]
        positions = tf.range(start=0, limit=length, delta=1)
        embedded_tokens = self.token_embeddings(inputs)
        embedded_positions = self.position_embeddings(positions)
        return embedded_tokens + embedded_positions


# ==========================================
# 2. MAIN ML ENGINE CLASS
# ==========================================
class PhonoLexMLEngine:
    def __init__(self):
        # Configuration for the new Transformer model
        self.model_path = "transformer_phonolex.h5"
        self.max_len = 20
        self.model = None
        self.input_tokenizer = None
        self.target_tokenizer = None
        self.is_loaded = False
        
        # Load resources upon initialization
        self._load_resources()

    def _load_resources(self):
        # 1. Safety check: Ensure the model file exists
        if not os.path.exists(self.model_path):
            print(f"⚠️ ML Model '{self.model_path}' not found. ML Prediction will be disabled.")
            return

        print("⏳ Initializing Tokenizers and Loading Transformer Model...")
        
        # 2. Initialize Tokenizers dynamically from the dataset
        try:
            df_clean = pd.read_csv('phonolex_dataset.csv')
            df_mega = pd.read_csv('mega_phonolex_dataset.csv')
            df_combined = pd.concat([df_clean, df_mega], ignore_index=True)
            df_combined.columns = ['singlish', 'sinhala']
            df_combined = df_combined.dropna()
            df = df_combined.drop_duplicates(subset=['singlish', 'sinhala'])
            
            singlish_texts = df.iloc[:, 0].apply(lambda x: " ".join(list(str(x).strip()))).tolist()
            sinhala_texts = df.iloc[:, 1].apply(lambda x: " ".join(list(str(x).strip()))).tolist()
            
            self.input_tokenizer = Tokenizer(char_level=False, filters='')
            self.input_tokenizer.fit_on_texts(singlish_texts)
            
            self.target_tokenizer = Tokenizer(char_level=False, filters='')
            self.target_tokenizer.fit_on_texts(sinhala_texts)
            
        except Exception as e:
            print(f"❌ Error loading datasets for tokenizers: {e}")
            self.is_loaded = False
            return
            
        # 3. Load the Transformer Model using custom objects
        custom_objects = {
            "TransformerEncoder": TransformerEncoder,
            "PositionalEmbedding": PositionalEmbedding
        }
        try:
            self.model = keras.models.load_model(self.model_path, custom_objects=custom_objects)
            self.is_loaded = True
            print("✅ ML Model (Transformer) loaded successfully for Inference!")
        except Exception as e:
            print(f"❌ Failed to load ML Model: {e}")
            self.is_loaded = False

    def predict_sinhala(self, singlish_word):
        # Fallback if model is not loaded or input is empty
        if not self.is_loaded:
            return None
            
        singlish_word = str(singlish_word).strip().lower()
        if not singlish_word:
            return None
        
        try:
            # 1. Preprocessing: Tokenize and pad the input characters
            chars = " ".join(list(singlish_word))
            seq = self.input_tokenizer.texts_to_sequences([chars])
            padded_seq = pad_sequences(seq, maxlen=self.max_len, padding='post')
            
            # 2. Inference: Predict token indices using the Transformer
            predictions = self.model.predict(padded_seq, verbose=0)
            predicted_indices = np.argmax(predictions[0], axis=-1)
            
            # 3. Decoding: Convert token indices back to Sinhala characters
            reverse_target_word_index = dict(map(reversed, self.target_tokenizer.word_index.items()))
            
            sinhala_chars = []
            for idx in predicted_indices:
                if idx == 0: # Ignore padding tokens
                    continue
                char = reverse_target_word_index.get(idx, "")
                sinhala_chars.append(char)
                
            return "".join(sinhala_chars).strip()
            
        except Exception as e:
            print(f"❌ ML Prediction Error for '{singlish_word}': {e}")
            return None

# Create a singleton instance for global use across the application
ml_engine = PhonoLexMLEngine()

# ==========================================
# 3. TEST BLOCK (Will only run if this file is executed directly)
# ==========================================
if __name__ == "__main__":
    test_words = ["amma", "gama", "potha", "mokada", "pasala"]
    print("\n--- Testing Transformer Model ---")
    for w in test_words:
        result = ml_engine.predict_sinhala(w)
        print(f"Singlish: {w} -> Sinhala: {result}")