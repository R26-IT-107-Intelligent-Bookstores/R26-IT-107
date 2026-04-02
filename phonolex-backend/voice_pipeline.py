import speech_recognition as sr

def capture_voice():
    # Initialize the recognizer
    recognizer = sr.Recognizer()

    # Use the system microphone
    with sr.Microphone() as source:
        print("\n[Microphone ON] Listening... (Speak in Sinhala)")
        # Adjust for 1 second to clear background noise
        recognizer.adjust_for_ambient_noise(source, duration=1)
        # Capture the audio
        audio = recognizer.listen(source)

    try:
        print("[Processing] Translating voice to text...")
        # Use Google STT with Sri Lankan Sinhala language code
        text = recognizer.recognize_google(audio, language="si-LK")
        return text
        
    except sr.UnknownValueError:
        print("[Error] Could not clearly hear the audio. Please try again.")
        return None
    except sr.RequestError as e:
        print(f"[Error] Network/API issue: {e}")
        return None