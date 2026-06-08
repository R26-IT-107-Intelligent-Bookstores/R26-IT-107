import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pandas as pd
import numpy as np
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# 1. Transformer Encoder Block
class TransformerEncoder(layers.Layer):
    def __init__(self, embed_dim, dense_dim, num_heads, **kwargs):
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
        # Add a new axis for the attention mask
        if mask is not None:
            mask = mask[:, tf.newaxis, :]
        
        # Calculate attention
        attention_output = self.attention(inputs, inputs, attention_mask=mask)
        proj_input = self.layernorm_1(inputs + attention_output)
        
        # Pass through dense layers
        proj_output = self.dense_proj(proj_input)
        return self.layernorm_2(proj_input + proj_output)

# 2. Positional Encoding
class PositionalEmbedding(layers.Layer):
    def __init__(self, sequence_length, vocab_size, embed_dim, **kwargs):
        super().__init__(**kwargs)
        self.token_embeddings = layers.Embedding(input_dim=vocab_size, output_dim=embed_dim)
        self.position_embeddings = layers.Embedding(input_dim=sequence_length, output_dim=embed_dim)
        self.sequence_length = sequence_length
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim

    def call(self, inputs):
        # Calculate position indices for the input sequence
        length = tf.shape(inputs)[-1]
        positions = tf.range(start=0, limit=length, delta=1)
        
        # Add token embeddings and position embeddings
        embedded_tokens = self.token_embeddings(inputs)
        embedded_positions = self.position_embeddings(positions)
        return embedded_tokens + embedded_positions

# 3. Model Building Function
def build_transformer(vocab_size, sequence_length):
    embed_dim = 256
    dense_dim = 512
    num_heads = 4

    # Define input layer
    encoder_inputs = keras.Input(shape=(None,), dtype="int64", name="encoder_inputs")
    
    # Apply positional embedding and transformer blocks
    x = PositionalEmbedding(sequence_length, vocab_size, embed_dim)(encoder_inputs)
    x = TransformerEncoder(embed_dim, dense_dim, num_heads)(x)
    
    # Output layer for character prediction using softmax activation
    encoder_outputs = layers.Dense(vocab_size, activation="softmax")(x)

    model = keras.Model(encoder_inputs, encoder_outputs, name="PhonoLex_Transformer")
    
    # Compile the model with sparse categorical crossentropy for token prediction
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model

# 4. Data Loading & Training Execution
if __name__ == "__main__":
    print("\n[INFO] Loading Datasets...")
    try:
        # Load both the manually cleaned and the auto-generated augmented datasets
        df_clean = pd.read_csv('phonolex_dataset.csv')
        df_mega = pd.read_csv('mega_phonolex_dataset.csv')
        
        # Combine both datasets into a single dataframe
        df_combined = pd.concat([df_clean, df_mega], ignore_index=True)
        
        # Standardize column names dynamically to prevent mismatches
        df_combined.columns = ['singlish', 'sinhala']
        
        # FIX: Drop any empty rows (NaN values) to prevent the 'float object is not iterable' error
        df_combined = df_combined.dropna()
        
        # Remove any duplicate pairs to keep the training data balanced
        df = df_combined.drop_duplicates(subset=['singlish', 'sinhala'])
        
        # Process at the character level: split words into space-separated characters
        # Explicitly convert to string and strip whitespace to handle edge cases
        singlish_texts = df.iloc[:, 0].apply(lambda x: " ".join(list(str(x).strip()))).tolist()
        sinhala_texts = df.iloc[:, 1].apply(lambda x: " ".join(list(str(x).strip()))).tolist()
        
        print(f"[INFO] Successfully loaded and combined {len(df)} valid records.")
    except Exception as e:
        print(f"[ERROR] Could not load datasets: {e}")
        exit()

    print("[INFO] Tokenizing characters...")
    
    # Initialize and fit tokenizer for Singlish inputs
    input_tokenizer = Tokenizer(char_level=False, filters='')
    input_tokenizer.fit_on_texts(singlish_texts)
    input_seqs = input_tokenizer.texts_to_sequences(singlish_texts)
    
    # Initialize and fit tokenizer for Sinhala outputs
    target_tokenizer = Tokenizer(char_level=False, filters='')
    target_tokenizer.fit_on_texts(sinhala_texts)
    target_seqs = target_tokenizer.texts_to_sequences(sinhala_texts)

    # Pad sequences to ensure uniform length for the neural network
    max_len = 20
    X_train = pad_sequences(input_seqs, maxlen=max_len, padding='post')
    y_train = pad_sequences(target_seqs, maxlen=max_len, padding='post')
    
    # Expand dimensions for sparse categorical crossentropy requirements
    y_train = np.expand_dims(y_train, -1)

    # Calculate total vocabulary size across both languages
    vocab_size = max(len(input_tokenizer.word_index), len(target_tokenizer.word_index)) + 2

    print("[INFO] Building Transformer Model...")
    model = build_transformer(vocab_size=vocab_size, sequence_length=max_len)
    model.summary()

    print("\n[INFO] Starting Model Training...")
    
    # Implement EarlyStopping to halt training if validation loss stops improving (prevents overfitting)
    early_stop = keras.callbacks.EarlyStopping(monitor='loss', patience=3, restore_best_weights=True)
    
    # Execute the training loop
    model.fit(X_train, y_train, epochs=20, batch_size=32, callbacks=[early_stop])
    
    print("\n[SUCCESS] Model Training Completed!")
    
    # Save the trained model weights for future inference
    model.save('transformer_phonolex.h5')
    print("[INFO] Model successfully saved as 'transformer_phonolex.h5'")