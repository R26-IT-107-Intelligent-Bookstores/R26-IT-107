import os
import time
import unicodedata
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from transformer_model import build_transformer
import warnings
warnings.filterwarnings('ignore')

MODEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "transformer_phonolex.h5")
DRIVE_FILE_ID = "1uI39rAcI3yhq4G2Sif887LQawTg539VE"

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
    MIN_PREDICTION_CONFIDENCE = 0.15

    def __init__(self):
        # Configuration for the new Transformer model
        self.model_path = MODEL_FILE
        self.max_len = 20
        self.model = None
        self.input_tokenizer = None
        self.target_tokenizer = None
        self.is_loaded = False
        
        # Load resources upon initialization
        self._load_resources()

    def _load_resources(self):
        # Download the model on first startup before checking whether it can load.
        if not os.path.exists(self.model_path):
            print("Model file not found locally. Downloading from Google Drive...")
            url = f"https://drive.google.com/uc?id={DRIVE_FILE_ID}"
            try:
                import gdown

                downloaded_path = gdown.download(url, self.model_path, quiet=False)
                if (
                    not downloaded_path
                    or not os.path.isfile(self.model_path)
                    or os.path.getsize(self.model_path) == 0
                ):
                    print("Failed to download the model: download did not produce a valid file.")
            except Exception as e:
                print(f"Failed to download the model: {e}")

        if not os.path.exists(self.model_path):
            print(f"ML Model '{self.model_path}' not found. ML Prediction will be disabled.")
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
            
        # Build the architecture before loading the saved weights.
        vocab_size = max(
            len(self.input_tokenizer.word_index),
            len(self.target_tokenizer.word_index),
        ) + 2
        try:
            self.model = build_transformer(
                vocab_size=vocab_size,
                sequence_length=self.max_len,
            )
            self.model.load_weights(self.model_path)
            self.is_loaded = True
            print("✅ ML Model (Transformer) weights loaded successfully for Inference!")
        except Exception as e:
            print(f"❌ Failed to load ML Model weights: {e}")
            self.is_loaded = False

    def _reverse_target_word_index(self, output_vocab_size):
        return {
            index: token
            for token, index in self.target_tokenizer.word_index.items()
            if 0 < index < output_vocab_size
        }

    @staticmethod
    def _is_valid_sinhala_text(text):
        if not text:
            return False

        text = unicodedata.normalize("NFC", text)
        if not any(
            "\u0d80" <= char <= "\u0dff"
            and unicodedata.category(char).startswith("L")
            for char in text
        ):
            return False

        previous_char = ""
        previous_was_dependent_sign = False
        for index, char in enumerate(text):
            if char.isspace():
                if not previous_char or previous_char.isspace():
                    return False
                previous_char = " "
                previous_was_dependent_sign = False
                continue

            if not "\u0d80" <= char <= "\u0dff":
                if char != "\u200d":
                    return False
                if (
                    previous_char != "\u0dca"
                    or index + 1 >= len(text)
                    or not unicodedata.category(text[index + 1]).startswith("L")
                ):
                    return False
                previous_char = char
                continue

            category = unicodedata.category(char)
            if category.startswith("L"):
                previous_char = char
                previous_was_dependent_sign = False
                continue

            if category.startswith("M"):
                if not previous_char or previous_char.isspace() or previous_char == "\u200d":
                    return False
                if char == "\u0dca":
                    if previous_char == "\u0dca" or previous_was_dependent_sign:
                        return False
                    previous_was_dependent_sign = False
                else:
                    if previous_was_dependent_sign or previous_char == "\u0dca":
                        return False
                    previous_was_dependent_sign = True
                previous_char = char
                continue

            return False

        return bool(previous_char and not previous_char.isspace())

    @staticmethod
    def _rule_based_fallback(singlish_word):
        from phonetic_engine import pure_rule_based_translate

        fallback = pure_rule_based_translate(singlish_word)
        clean_fallback = unicodedata.normalize("NFC", " ".join(fallback.split()))
        return clean_fallback if PhonoLexMLEngine._is_valid_sinhala_text(clean_fallback) else ""

    def _minimum_prediction_length(self, singlish_word):
        return 1 if len(singlish_word.replace(" ", "")) <= 2 else 2

    def _fallback_prediction(self, singlish_word):
        fallback = self._rule_based_fallback(singlish_word)
        return fallback or None

    def predict_sinhala(self, singlish_word):
        """
        Greedy Search: Returns the single most probable Sinhala character sequence.
        """
        if not self.is_loaded:
            print("❌ ML Model is inactive: model failed to load; Sinhala prediction is unavailable.")
            return None
            
        singlish_word = str(singlish_word).strip().lower()
        if not singlish_word:
            return None
        
        try:
            # 1. Preprocessing: Tokenize and pad the input characters
            chars = " ".join(list(singlish_word))
            seq = self.input_tokenizer.texts_to_sequences([chars])
            padded_seq = pad_sequences(seq, maxlen=self.max_len, padding='post')
            
            # 2. Inference: Direct Tensor Call for ultra-fast speed (Bypasses .predict() overhead)
            predictions = self.model(padded_seq, training=False).numpy()[0]
            if (
                predictions.ndim != 2
                or predictions.shape[-1] < 2
                or predictions.shape[0] == 0
            ):
                return self._fallback_prediction(singlish_word)
            predicted_indices = np.argmax(predictions, axis=-1)
            
            output_vocab_size = predictions.shape[-1]
            reverse_target_word_index = self._reverse_target_word_index(output_vocab_size)
            
            sinhala_chars = []
            confidence_scores = []
            for position, idx in enumerate(predicted_indices):
                if idx == 0:  # Padding/end of sequence.
                    break
                char = reverse_target_word_index.get(int(idx))
                if char is None:
                    return self._fallback_prediction(singlish_word)
                sinhala_chars.append(char)
                confidence_scores.append(float(predictions[position, idx]))

            prediction = unicodedata.normalize(
                "NFC", "".join(sinhala_chars).strip()
            ) if sinhala_chars else ""
            minimum_length = self._minimum_prediction_length(singlish_word)
            if (
                len(sinhala_chars) < minimum_length
                or not confidence_scores
                or np.mean(confidence_scores) < self.MIN_PREDICTION_CONFIDENCE
                or not self._is_valid_sinhala_text(prediction)
            ):
                return self._fallback_prediction(singlish_word)

            return " ".join(prediction.split())
            
        except Exception as e:
            print(f"❌ ML Prediction Error for '{singlish_word}': {e}")
            return self._fallback_prediction(singlish_word)

    def predict_sinhala_beam_search(self, singlish_word, beam_width=3):
        """
        Beam Search: Returns the top 'beam_width' suggestions for a given Singlish word
        by exploring multiple highly probable character paths.
        """
        if not self.is_loaded:
            print("❌ ML Model is inactive: model failed to load; beam-search prediction is unavailable.")
            return []
            
        singlish_word = str(singlish_word).strip().lower()
        if not singlish_word:
            return []
        
        try:
            # 1. Preprocessing
            chars = " ".join(list(singlish_word))
            seq = self.input_tokenizer.texts_to_sequences([chars])
            padded_seq = pad_sequences(seq, maxlen=self.max_len, padding='post')
            
            # 2. Get probabilities for all character positions (Direct Tensor Call)
            predictions = self.model(padded_seq, training=False).numpy()[0]
            if (
                predictions.ndim != 2
                or predictions.shape[-1] < 2
                or predictions.shape[0] == 0
            ):
                fallback = self._rule_based_fallback(singlish_word)
                return [fallback] if fallback else []
            output_vocab_size = predictions.shape[-1]
            reverse_target_word_index = self._reverse_target_word_index(output_vocab_size)
            valid_indices = np.array([0, *reverse_target_word_index.keys()])
            if len(valid_indices) < 2:
                fallback = self._fallback_prediction(singlish_word)
                return [fallback] if fallback else []
            
            # Initialize Beam Search: list of tuples (sequence_of_indices, log_probability)
            beams = [([], 0.0, False)]
            
            for pos in range(min(self.max_len, predictions.shape[0])):
                new_beams = []
                probs = predictions[pos]
                
                valid_probs = probs[valid_indices]
                top_indices = valid_indices[
                    np.argsort(valid_probs)[-min(max(int(beam_width), 1), len(valid_indices)):]
                ]
                
                for seq_indices, log_prob, ended in beams:
                    if ended:
                        new_beams.append((seq_indices, log_prob, True))
                        continue
                    for idx in top_indices:
                        new_log_prob = log_prob + np.log(probs[idx] + 1e-10)
                        new_beams.append((seq_indices + [int(idx)], new_log_prob, idx == 0))
                
                # Sort all expanded beams by score in descending order and keep top 'beam_width'
                beams = sorted(new_beams, key=lambda x: x[1], reverse=True)[:max(int(beam_width), 1)]
                
            suggestions = []
            for seq_indices, score, _ in beams:
                if 0 in seq_indices:
                    seq_indices = seq_indices[:seq_indices.index(0)]
                sinhala_chars = [reverse_target_word_index.get(idx) for idx in seq_indices]
                if any(
                    char is None or not self._is_valid_sinhala_text(char)
                    for char in sinhala_chars
                ):
                    continue
                word = unicodedata.normalize("NFC", "".join(sinhala_chars).strip())
                
                confidence = np.exp(score / max(len(seq_indices), 1))
                if (
                    len(sinhala_chars) >= self._minimum_prediction_length(singlish_word)
                    and word
                    and confidence >= self.MIN_PREDICTION_CONFIDENCE
                    and self._is_valid_sinhala_text(word)
                    and word not in suggestions
                ):
                    suggestions.append(word)

            if not suggestions:
                fallback = self._fallback_prediction(singlish_word)
                return [fallback] if fallback else []
            return suggestions
            
        except Exception as e:
            print(f"❌ Beam Search Prediction Error for '{singlish_word}': {e}")
            fallback = self._fallback_prediction(singlish_word)
            return [fallback] if fallback else []

# Create a singleton instance for global use across the application
ml_engine = PhonoLexMLEngine()

# ==========================================
# 3. TEST BLOCK (Will only run if this file is executed directly)
# ==========================================
if __name__ == "__main__":
    test_words = ["amma", "gama", "mokada", "pasala"]
    
    print("\n--- Speed & Accuracy Test (Greedy vs Beam Search) ---")
    for w in test_words:
        start_time = time.time()
        
        # Standard Greedy Search
        greedy_result = ml_engine.predict_sinhala(w)
        
        # New Beam Search with 3 alternatives
        beam_results = ml_engine.predict_sinhala_beam_search(w, beam_width=3)
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        print(f"\nSinglish Input  : {w}")
        print(f"🔹 Greedy Output : {greedy_result}")
        print(f"🚀 Beam Search   : {beam_results}")
        print(f"⏱️ Inference Time: {elapsed_ms:.2f} ms")