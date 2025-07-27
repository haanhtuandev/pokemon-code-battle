from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
import json
from dotenv import load_dotenv
import re
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
app = FastAPI()
# Allow frontend origin (adjust this if you deploy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5500"] for specific port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

class CodeRequest(BaseModel):
    code: str
    language: str
    player_name: str

@app.post("/commentary")
@app.post("/commentary")
def generate_commentary(request: CodeRequest):
    prompt = f"""
You are a code battle commentator in a Pokémon-style match.

Code written by {request.player_name} in {request.language}:

{request.code}

Task:
1. Check if this code correctly solves the "check if a number is prime" problem.
2. Respond in the following JSON format ONLY:

{{
  "commentary": "<short witty battle narration like: Pikachu strikes with Thunderbolt... It lands perfectly!>",
  "is_correct": true or false
}}

If the code is wrong, still give commentary in same style but reflect a failed move.
    """

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a witty Pokémon-style code duel narrator. Respond ONLY in JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
    }

    response = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers=headers,
        json=body
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="DeepSeek API call failed")

    try:
        result = response.json()
        message = result["choices"][0]["message"]["content"]

        print("\n===== RAW LLM RESPONSE =====")
        print(message)
        print("============================\n")

        # strip md code block if present
        # grabs text between ```json and ```
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", message, re.DOTALL)
        if match:
            message_clean = match.group(1)
        else:
            message_clean = message.strip()

        parsed = json.loads(message_clean)

        return {
            "commentary": parsed["commentary"],
            "is_correct": parsed["is_correct"]
        }

    except Exception as e:
        print("Parsing error:", e)
        print("Raw LLM output:", message)
        raise HTTPException(status_code=500, detail="Failed to parse DeepSeek response")
