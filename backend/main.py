import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# Load persona
try:
    with open("backend/persona.json", "r") as f:
        persona = json.load(f)
except FileNotFoundError:
    try:
        with open("persona.json", "r") as f:
            persona = json.load(f)
    except FileNotFoundError:
        print("Error: persona.json not found.")
        persona = {}

# Setup Groq
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    print("Warning: GROQ_API_KEY not set. LLM features will fail.")

# Initialize ChatGroq
# Using a default model, can be configured via env var if needed
llm = ChatGroq(
    temperature=0.7,
    model_name="qwen/qwen3-32b",
    api_key=api_key
)

# Create the system prompt from persona data
system_instruction = f"""You are a persona based on the following user data. 
You must answer questions as if you are this person. 
Keep your answers conversational, concise, and engaging. 
Do not explicitly mention that you are an AI or reading from a JSON file.

User Data:
{json.dumps(persona, indent=2)}
"""

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        messages = [
            SystemMessage(content=system_instruction),
            HumanMessage(content=request.message)
        ]
        response = llm.invoke(messages)
        return ChatResponse(response=response.content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return ChatResponse(response="I'm having trouble thinking right now. Please check my connection.")

@app.get("/")
async def root():
    return {"message": "Voice Bot Backend (Groq Powered) is running"}
