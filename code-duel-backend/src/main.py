from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
import json
from dotenv import load_dotenv
import re
from fastapi.middleware.cors import CORSMiddleware
from src.problem_bank import PROBLEM_BANK
import random

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
    # problem_title: str
    problem_description: str


game_state = {
    "player_hp": 100,
    "bot_hp": 100
}


@app.post("/commentary")
def generate_commentary(request: CodeRequest):
    
    # Build DeepSeek prompt
    prompt = f"""
    You are a code battle commentator in a Pokémon-style match. Use Pokemon battle style battle narration, keep the respond short and succint

    {request.player_name} is using a move to solve this problem:

    {request.problem_description}

    Code in {request.language}:
    {request.code}

    Task:
    1. Check if this code solves the problem above.
    2. Respond in JSON ONLY:
    {{ "commentary": "...", "is_correct": true/false }}
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

        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", message, re.DOTALL)
        if match:
            message_clean = match.group(1)
        else:
            message_clean = message.strip()

        parsed = json.loads(message_clean)

        for move_problems in PROBLEM_BANK.values():
            for prob in move_problems:
                if prob["description"].strip() == request.problem_description.strip():
                    return {
                        "commentary": parsed["commentary"],
                        "is_correct": parsed["is_correct"],
                        "damage": prob["damage"] if parsed["is_correct"] else 0
                    }


        return {
            "commentary": parsed["commentary"],
            "is_correct": parsed["is_correct"],
            "damage": 0
        }

    except Exception as e:
        print("Parsing error:", e)
        print("Raw LLM output:", message)
        raise HTTPException(status_code=500, detail="Failed to parse DeepSeek response")



@app.get("/problem/{move}")
async def get_problem(move: str):
    move = move.lower()
    if move not in PROBLEM_BANK:
        raise HTTPException(status_code=404, detail="Move not found")
    return random.choice(PROBLEM_BANK[move])

class TurnRequest(CodeRequest):
    pass  # Inherits from CodeRequest (already has all needed fields)

@app.post("/turn")
def player_turn(request: TurnRequest):
    result = generate_commentary(request)

    # Player attacks BOT
    if result["is_correct"]:
        game_state["bot_hp"] = max(0, game_state["bot_hp"] - result["damage"])
        player_hit = True
    else:
        player_hit = False

    # Now trigger BOT turn
    move = random.choice(["Scratch", "Furry Swipes", "Bite", "Pay Day"])
    move_damage = {
        "Scratch": 10,
        "Furry Swipes": 15,
        "Bite": 20,
        "Pay Day": 25
    }

    success = random.random() < 0.7  # 70% chance to hit
    if success:
        bot_damage = move_damage[move]
        game_state["player_hp"] = max(0, game_state["player_hp"] - bot_damage)
        bot_commentary = f"Meowth used {move}! It's super effective and dealt {bot_damage} damage!"
        bot_hit = True
    else:
        bot_damage = 0
        bot_commentary = f"Meowth used {move} but missed! You're lucky!"
        bot_hit = False


    return {
        "player_commentary": result["commentary"],
        "player_hit": player_hit,
        "player_hp": game_state["player_hp"],
        "bot_hp": game_state["bot_hp"],

        "bot_commentary": bot_commentary,
        "bot_hit": bot_hit,
        "bot_move": move
    }


@app.get("/bot-turn")
def bot_turn():
    move = random.choice(["Scratch", "Furry Swipes", "Bite", "Pay Day"])
    move_damage = {
        "Scratch": 10,
        "Furry Swipes": 15,
        "Bite": 20,
        "Pay Day": 25
    }

    success = random.random() < 0.7  # 70% chance to hit
    if success:
        damage = move_damage[move]
        game_state["player_hp"] = max(0, game_state["player_hp"] - damage)
        commentary = f"Meowth used {move}! It's super effective and dealt {damage} damage!"
    else:
        damage = 0
        commentary = f"Meowth used {move} but missed! You're lucky!"

    return {
        "bot_commentary": commentary,
        "bot_hit": success,
        "damage": damage,
        "bot_hp": game_state["bot_hp"],
        "player_hp": game_state["player_hp"]
    }


@app.post("/reset")
def reset_game():
    game_state["player_hp"] = 100
    game_state["bot_hp"] = 100
    return {"message": "Game reset", "player_hp": 100, "bot_hp": 100}