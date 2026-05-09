import csv
import pickle
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping

# 1. Reading the Dataset from the CSV file (No manual typing!)
data_pairs = []
with open("augmented_phonolex_dataset.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader) # Skip the first row (Header)
    for row in reader:
        if len(row) == 2:
            data_pairs.append((row[0], row[1]))

print(f"📚 Successfully loaded {len(data_pairs)} word pairs for training!")

# Separating characters (Character Sets)
input_characters = set()
target_characters = set()

# Special tokens for the model to understand the start (\t) and end (\n)
for eng, sin in data_pairs:
    for char in eng:
        if char not in input_characters: input_characters.add(char)
    for char in sin:
        if char not in target_characters: target_characters.add(char)

input_characters = sorted(list(input_characters))
target_characters = sorted(list(target_characters) + ['\t', '\n'])

num_encoder_tokens = len(input_characters)
num_decoder_tokens = len(target_characters)
max_encoder_seq_length = max([len(eng) for eng, sin in data_pairs])
max_decoder_seq_length = max([len(sin) for eng, sin in data_pairs]) + 2 

print(f"🔤 Unique input tokens (English letters): {num_encoder_tokens}")
print(f"🔤 Unique output tokens (Sinhala letters): {num_decoder_tokens}")

# Dictionaries for converting characters into numbers
input_token_index = dict([(char, i) for i, char in enumerate(input_characters)])
target_token_index = dict([(char, i) for i, char in enumerate(target_characters)])
reverse_target_char_index = dict((i, char) for char, i in target_token_index.items())

# 2. Data preparation (One-Hot Encoding)
encoder_input_data = np.zeros((len(data_pairs), max_encoder_seq_length, num_encoder_tokens), dtype="float32")
decoder_input_data = np.zeros((len(data_pairs), max_decoder_seq_length, num_decoder_tokens), dtype="float32")
decoder_target_data = np.zeros((len(data_pairs), max_decoder_seq_length, num_decoder_tokens), dtype="float32")

for i, (input_text, target_text) in enumerate(data_pairs):
    target_text = '\t' + target_text + '\n' 
    for t, char in enumerate(input_text):
        encoder_input_data[i, t, input_token_index[char]] = 1.0
    for t, char in enumerate(target_text):
        decoder_input_data[i, t, target_token_index[char]] = 1.0
        if t > 0:
            decoder_target_data[i, t - 1, target_token_index[char]] = 1.0

# 3. Building the Seq2Seq Architecture
latent_dim = 256 # Number of neurons (Increased to 256 because of more data)

# Encoder
encoder_inputs = Input(shape=(None, num_encoder_tokens))
encoder_lstm = LSTM(latent_dim, return_state=True)
encoder_outputs, state_h, state_c = encoder_lstm(encoder_inputs)
encoder_states = [state_h, state_c]

# Decoder
decoder_inputs = Input(shape=(None, num_decoder_tokens))
decoder_lstm = LSTM(latent_dim, return_sequences=True, return_state=True)
decoder_outputs, _, _ = decoder_lstm(decoder_inputs, initial_state=encoder_states)
decoder_dense = Dense(num_decoder_tokens, activation="softmax")
decoder_outputs = decoder_dense(decoder_outputs)

# Model Training
model = Model([encoder_inputs, decoder_inputs], decoder_outputs)
model.compile(optimizer="rmsprop", loss="categorical_crossentropy", metrics=["accuracy"])

print("\n🚀 ML Model Training started... This may take a few minutes.")

# Early stopping callback to preserve best weights and prevent overfitting
early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)

# Training for 300 Epochs. Batch size is 32.
model.fit(
    [encoder_input_data, decoder_input_data], decoder_target_data,
    batch_size=32,
    epochs=300,
    validation_split=0.1,
    callbacks=[early_stop]
)

# Model Save 
model.save("phonolex_seq2seq.h5")

# Save dictionaries for backend inference
with open('phonolex_dicts.pkl', 'wb') as f:
    pickle.dump({
        'input_token_index': input_token_index,
        'target_token_index': target_token_index,
        'reverse_target_char_index': reverse_target_char_index,
        'max_encoder_seq_length': max_encoder_seq_length,
        'max_decoder_seq_length': max_decoder_seq_length,
        'num_encoder_tokens': num_encoder_tokens,
        'num_decoder_tokens': num_decoder_tokens
    }, f)
print("\n✅ Awesome! Model trained and saved as 'phonolex_seq2seq.h5'.")
print("✅ Dictionaries successfully saved to 'phonolex_dicts.pkl'\n")

# 4. Inference (Testing new words with the trained Model)
encoder_model = Model(encoder_inputs, encoder_states)

decoder_state_input_h = Input(shape=(latent_dim,))
decoder_state_input_c = Input(shape=(latent_dim,))
decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]
decoder_outputs, state_h, state_c = decoder_lstm(decoder_inputs, initial_state=decoder_states_inputs)
decoder_states = [state_h, state_c]
decoder_outputs = decoder_dense(decoder_outputs)
decoder_model = Model([decoder_inputs] + decoder_states_inputs, [decoder_outputs] + decoder_states)

def transliterate(input_seq):
    input_vec = np.zeros((1, max_encoder_seq_length, num_encoder_tokens), dtype="float32")
    for t, char in enumerate(input_seq):
        if char in input_token_index:
            input_vec[0, t, input_token_index[char]] = 1.0

    states_value = encoder_model.predict(input_vec, verbose=0)
    target_seq = np.zeros((1, 1, num_decoder_tokens))
    target_seq[0, 0, target_token_index['\t']] = 1.0

    stop_condition = False
    decoded_sentence = ""

    while not stop_condition:
        output_tokens, h, c = decoder_model.predict([target_seq] + states_value, verbose=0)
        sampled_token_index = np.argmax(output_tokens[0, -1, :])
        sampled_char = reverse_target_char_index[sampled_token_index]
        
        if sampled_char != '\n':
            decoded_sentence += sampled_char

        if sampled_char == '\n' or len(decoded_sentence) > max_decoder_seq_length:
            stop_condition = True

        target_seq = np.zeros((1, 1, num_decoder_tokens))
        target_seq[0, 0, sampled_token_index] = 1.0
        states_value = [h, c]

    return decoded_sentence

# 5. Let's test it!
print("--- Model results for new words ---")
# These words are not in the CSV, but have a similar pattern
test_words = ["kumria", "gndara", "wikrooti", "raasa", "sevnalla"]
for word in test_words:
    print(f"Singlish: {word} -> ML Prediction (Sinhala): {transliterate(word)}")