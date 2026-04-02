# Import the custom modules built for the PhonoLex-SL system
import time  # Added time module to measure system latency
from voice_pipeline import capture_voice
from phonetic_engine import normalize_singlish
from retrieval_engine import acoustic_match

def process_and_search(query_text):
    # Common core function to execute the cross-script search logic
    print("\n--- Starting Cross-Script Retrieval ---")
    
    # Start the performance timer
    start_time = time.time()
    
    # Pass the formatted query to the acoustic matching algorithm
    results = acoustic_match(query_text)
    
    # End the performance timer
    end_time = time.time()
    
    # Calculate the total execution latency in seconds
    execution_time = end_time - start_time
    
    # Display the final results to the user
    print("\n" + "="*40)
    print("   [FINAL OUTPUT] Context-Aware Recommendations")
    print("="*40)
    for i, result in enumerate(results, 1):
        print(f" {i}. {result}")
    print("="*40)
    
    # Display the performance metrics
    print(f"\n⏱️  Query Execution Time: {execution_time:.4f} seconds")
    
    # Validate against the < 1.5 seconds Non-Functional Requirement
    if execution_time < 1.5:
        print("✅ [Performance Status] Pass: System meets the < 1.5s real-time threshold.")
    else:
        print("⚠️ [Performance Status] Fail: System latency is too high. Optimization needed.")

def main():
    # Application Entry Point
    print("="*40)
    print("   PhonoLex-SL System Initiated")
    print("="*40)
    print("1. Voice Input (Spoken Sinhala)")
    print("2. Text Input (Typed Singlish)")

    # Capture the user's preferred input modality
    choice = input("\nEnter your choice (1 or 2): ")

    if choice == '1':
        print("\n--- Starting Native Voice Pipeline ---")
        captured_text = capture_voice()
        
        if captured_text:
            print(f"\n[STT Output]: {captured_text}")
            # Send the captured voice text directly to the database search engine
            process_and_search(captured_text)
            
    elif choice == '2':
        print("\n--- Starting Phonetic Normalization Engine ---")
        singlish_text = input("Type your Singlish query: ")
        
        # Normalize the Singlish text into standard Sinhala phonemes
        normalized_text = normalize_singlish(singlish_text)
        print(f"\n[Normalized Text]: {normalized_text}")
        
        # Send the normalized Sinhala text to the database search engine
        process_and_search(normalized_text)
        
    else:
        print("\n[Error] Invalid choice. Please run the program again.")

# Ensure the script runs only when executed directly
if __name__ == "__main__":
    main()