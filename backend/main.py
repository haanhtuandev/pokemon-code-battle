from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os

app = FastAPI()

# Define your Groq API credentials
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # store securely in your .env or environment

# Pydantic request body model
class Submission(BaseModel):
    problem_description: str
    code: str
    player_name: str

# Generate the battle-style prompt
def generate_prompt(problem_description: str, code: str, player_name: str) -> str:
    return f"""
You are the commentator of a code battle between two programmers. Your job is to analyze {player_name}'s code attempt for a given problem and respond with **fun, energetic, Pokémon-style battle narration**.

### Problem:
{problem_description}

### {player_name}'s Code:
```python
{code}
```

### Instructions:
- Briefly evaluate the code (correctness, style, logic).
- Then respond with a 1-2 sentence battle-style narration.
- Keep it energetic, thematic, and *never rude*.
- Use Pokémon-style or video-game metaphors where appropriate.
- If the code is perfect, praise it like a "critical hit!"
- If there’s an error, say it like a "missed attack" or "ineffective strike!"

### Output:
"""

@app.post("/commentary")
async def generate_commentary(submission: Submission):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Missing Groq API Key")

    prompt = generate_prompt(submission.problem_description, submission.code, submission.player_name)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "llama3-70b-8192",
        "temperature": 0.8,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(GROQ_API_URL, headers=headers, json=data)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to connect to Groq API")

    content = response.json()["choices"][0]["message"]["content"]
    return {"commentary": content}
