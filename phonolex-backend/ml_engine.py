import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Input, LSTM
import pickle
import os

class PhonoLexMLEngine:
    def __init__(self):
        self.model_path = "phonolex_seq2seq.h5"
        self.dict_path = "phonolex_dicts.pkl"
        self.is_loaded = False
        self._load_resources()

    def _load_resources(self):
        try:
            if not os.path.exists(self.model_path) or not os.path.exists(self.dict_path):
                print("⚠️ ML Model or Dictionary files not found. ML Prediction will be disabled.")
                return

            print("⏳ Loading ML Model and Dictionaries...")
            
            with open(self.dict_path, 'rb') as f:
                dicts = pickle.load(f)
                self.input_token_index = dicts['input_token_index']
                self.target_token_index = dicts['target_token_index']
                self.reverse_target_char_index = dicts['reverse_target_char_index']
                self.max_encoder_seq_length = dicts['max_encoder_seq_length']
                self.max_decoder_seq_length = dicts['max_decoder_seq_length']
                self.num_encoder_tokens = dicts['num_encoder_tokens']
                self.num_decoder_tokens = dicts['num_decoder_tokens']

            self.model = load_model(self.model_path)
            latent_dim = self.model.layers[2].units

            encoder_inputs = self.model.input[0]
            encoder_lstm = self.model.layers[2]
            encoder_outputs, state_h_enc, state_c_enc = encoder_lstm(encoder_inputs)
            encoder_states = [state_h_enc, state_c_enc]
            self.encoder_model = Model(encoder_inputs, encoder_states)

            decoder_inputs = self.model.input[1]
            decoder_state_input_h = Input(shape=(latent_dim,), name="decoder_state_h")
            decoder_state_input_c = Input(shape=(latent_dim,), name="decoder_state_c")
            decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]
            
            decoder_lstm = self.model.layers[3]
            decoder_outputs, state_h_dec, state_c_dec = decoder_lstm(
                decoder_inputs, initial_state=decoder_states_inputs
            )
            decoder_states = [state_h_dec, state_c_dec]
            
            decoder_dense = self.model.layers[4]
            decoder_outputs = decoder_dense(decoder_outputs)
            
            self.decoder_model = Model(
                [decoder_inputs] + decoder_states_inputs, [decoder_outputs] + decoder_states
            )

            self.is_loaded = True
            print("✅ ML Model loaded successfully for Inference!")

        except Exception as e:
            print(f"❌ Failed to load ML Model: {e}")
            self.is_loaded = False

    def predict_sinhala(self, singlish_word):
        if not self.is_loaded:
            return None

        singlish_word = str(singlish_word).strip().lower()
        if not singlish_word:
            return None

        input_seq = np.zeros((1, self.max_encoder_seq_length, self.num_encoder_tokens), dtype="float32")
        for t, char in enumerate(singlish_word):
            if char in self.input_token_index and t < self.max_encoder_seq_length:
                input_seq[0, t, self.input_token_index[char]] = 1.0

        try:
            states_value = self.encoder_model.predict(input_seq, verbose=0)
            target_seq = np.zeros((1, 1, self.num_decoder_tokens))
            target_seq[0, 0, self.target_token_index['\t']] = 1.0

            stop_condition = False
            decoded_sentence = ""

            while not stop_condition:
                output_tokens, h, c = self.decoder_model.predict([target_seq] + states_value, verbose=0)
                sampled_token_index = np.argmax(output_tokens[0, -1, :])
                sampled_char = self.reverse_target_char_index[sampled_token_index]
                
                if sampled_char != '\n':
                    decoded_sentence += sampled_char

                if sampled_char == '\n' or len(decoded_sentence) > self.max_decoder_seq_length:
                    stop_condition = True

                target_seq = np.zeros((1, 1, self.num_decoder_tokens))
                target_seq[0, 0, sampled_token_index] = 1.0
                states_value = [h, c]

            return decoded_sentence.strip()
        except Exception as e:
            print(f"ML Prediction Error for '{singlish_word}': {e}")
            return None

ml_engine = PhonoLexMLEngine()
