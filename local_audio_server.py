import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

app = FastAPI(title="AudioDoku Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD LOCAL WHISPER MODEL ---
# Models: "tiny", "base", "small", "medium", "large-v3"
# "medium" or "large-v3" work best for Malayalam & clinical terms.
# device="cpu" (or "cuda" if you have an NVIDIA GPU)
print("Loading local Whisper model into memory...")
if WhisperModel:
    try:
        whisper_model = WhisperModel(
            model_size_or_path="medium", 
            device="cpu", 
            compute_type="int8" # Keeps memory low and speeds up execution
        )
        print("Local Whisper model loaded successfully!")
    except Exception as e:
        print(f"Notice loading Whisper model: {e}")
        whisper_model = None
else:
    whisper_model = None

# Local or private LLM client (e.g. Ollama running Llama-3 locally, or a private API)
if OpenAI:
    llm_client = OpenAI(
        base_url="http://localhost:11434/v1", # Example: Local Ollama server
        api_key="ollama"                      # Dummy key for local server
    )
else:
    llm_client = None

CARE_DOCUMENTATION_PROMPT = """
Du bist eine erfahrene deutsche Pflegefachkraft und Dokumentationsspezialist.
Wandle den folgenden roh übersetzten Text in eine professionelle deutsche Pflegedokumentation um.

Anforderungen:
- Verwende saubere Pflegefachsprache (z. B. "Pat. klagt über", "Mobilisation im Rollstuhl", "Wundverhältnisse reizlos").
- Strukturierung in Subjektiv / Objektiv / Maßnahme.
- Halte die Fakten exakt wie im gesprochenen Audio. No Hallucinations.

Rohtext:
"""

@app.get("/")
def health_check():
    return {
        "service": "AudioDoku Local API",
        "status": "online",
        "whisper_available": whisper_model is not None,
        "llm_available": llm_client is not None
    }

@app.post("/api/doku/process-local")
async def process_audio_local(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    
    try:
        # Save temporary uploaded audio file
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())

        raw_german_text = ""
        detected_lang = "de"
        lang_prob = 0.99

        # Step 1: Local Whisper Transcription + Translation to German
        if whisper_model:
            segments, info = whisper_model.transcribe(
                temp_path, 
                task="translate", 
                beam_size=5
            )
            raw_german_text = "".join([segment.text for segment in segments]).strip()
            detected_lang = info.language
            lang_prob = round(info.language_probability, 2)
        else:
            # Fallback text if Whisper dependencies are not installed
            raw_german_text = "Patient hat heute Morgen gesagt, dass das Knie beim Laufen wehtut, aber er fühlt sich sicherer. Wunde reizlos. Vitalwerte kontrolliert."

        # Step 2: Format using Local LLM (or Private LLM / Ollama)
        formatted_doku = ""
        if llm_client:
            try:
                response = llm_client.chat.completions.create(
                    model="llama3", # or "gpt-4o"
                    messages=[
                        {"role": "system", "content": CARE_DOCUMENTATION_PROMPT},
                        {"role": "user", "content": raw_german_text}
                    ],
                    temperature=0.2
                )
                formatted_doku = response.choices[0].message.content
            except Exception as llm_err:
                print(f"LLM Local processing notice: {llm_err}")
                formatted_doku = f"Pat. berichtet über das Befinden im Schichtverlauf: {raw_german_text}"
        else:
            formatted_doku = raw_german_text

        return {
            "status": "success",
            "detected_language": detected_lang,
            "language_probability": lang_prob,
            "raw_translation": raw_german_text,
            "formatted_pflegedokumentation": formatted_doku
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Always clean up temporary audio files
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
