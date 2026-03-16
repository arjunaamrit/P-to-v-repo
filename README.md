<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>



Prompt-to-Video AI Animator is a proof-of-concept system that takes a natural language prompt and produces a structured plan for an animated educational video.
Instead of generating full video frames, this project focuses on producing:
An educational script
A scene breakdown
Structured JSON animation plan
Voice narration script
This prototype demonstrates AI reasoning, multimodal planning, and deployable backend logic — all powered by the Gemini API in Google AI Studio.
The architecture is designed to be deployable via Google Cloud Run, with clean modular code that can later be extended to real video rendering (e.g. using Remotion + FFmpeg).
Architecture
User Prompt
     ↓
FastAPI Backend
     ↓
Vector Search (ChromaDB)
     ↓
Gemini AI Agents
     ↓
Animation Plan JSON
     ↓
Frontend / Preview (Future)
     ↓
Video Rendering (Future)
The backend handles:
Prompt processing
Knowledge retrieval (vector search)
Script generation
Scene decomposition
Animation JSON plan creation
Dependencies
See requirements.txt for the full list of Python dependencies.
Backend Files
backend/main.py
FastAPI application with a single endpoint to generate video plans.
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pipeline import run_pipeline

app = FastAPI()

class PromptRequest(BaseModel):
    prompt: str

@app.post("/generate-video")
async def generate_video(req: PromptRequest):
    try:
        result = await run_pipeline(req.prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
backend/gemini_client.py
Wrapper for Gemini API calls.
import os
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

async def generate_text(prompt: str) -> str:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text
backend/vector_search.py
Vector search using ChromaDB.
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.Client()
collection = client.get_or_create_collection("knowledge")

def ingest_documents(docs, ids):
    embeddings = model.encode(docs)
    collection.add(documents=docs, embeddings=embeddings.tolist(), ids=ids)

def search_context(query: str, n=3):
    q_emb = model.encode([query]).tolist()
    results = collection.query(query_embeddings=q_emb, n_results=n)
    return results
backend/animation_planner.py
Converts scenes into structured animation JSON.
def plan_animations(scenes):
    animation_plan = []
    for idx, scene in enumerate(scenes):
        plan = {
            "scene": idx+1,
            "objects": [
                {"type": "diagram", "animation": "draw"},
                {"type": "text_overlay", "animation": "fade_in"}
            ],
            "duration": scene.get("duration", 8)
        }
        animation_plan.append(plan)
    return animation_plan
backend/pipeline.py
Core orchestrator that chains all steps.
from gemini_client import generate_text
from vector_search import search_context
from animation_planner import plan_animations

async def run_pipeline(prompt: str):
    context_docs = search_context(prompt)
    context_text = "\n".join(doc["document"] for doc in context_docs["documents"])

    script_prompt = f"Write a clear script for: {prompt}\nContext:\n{context_text}"
    script = await generate_text(script_prompt)

    scene_prompt = f"Break the script into scenes:\n{script}"
    scenes_text = await generate_text(scene_prompt)
    scenes = [{"description": s.strip(), "duration": 8} for s in scenes_text.split("\n") if s.strip()]

    animation_plan = plan_animations(scenes)

    return {
        "script": script,
        "scenes": scenes,
        "animation_plan": animation_plan
    }
Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
requirements.txt
fastapi
uvicorn
chromadb
sentence-transformers
google-generativeai
pydantic
python-dotenv
.env.example
GEMINI_API_KEY=your_gemini_api_key_here
Copy .env.example → .env and fill in your API key.
Deployment
Export the project to GitHub via Google AI Studio.
Deploy using:
gcloud run deploy prompt-video-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
This creates a serverless endpoint that accepts POST /generate-video.
Research Background
This project draws inspiration from recent advances in multimodal AI models:
Omni-Diffusion
Shows how discrete diffusion models can unify understanding and generation across text, speech, and images — pointing toward future unified multimodal (including video) generation.
DART — Denoising Autoregressive Transformer
A hybrid diffusion + autoregressive model for scalable, high-quality image generation — an approach that could extend to efficient video synthesis.
Conclusion
This repository lays the foundation for a prompt-to-video AI system with emphasis on structured animation planning and multimodal reasoning. While full video rendering is left for future work, the current prototype already demonstrates the core logic and deployable architecture needed for next-generation educational AI video generation.










# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/75485c33-03b7-4e91-8d30-7627b849ca99

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
