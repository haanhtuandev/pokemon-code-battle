# Pokemon Code Battle

**Pokemon Code Battle** is a gamified coding battle platform inspired by the classic Pokémon battle interface. Players solve programming problems to launch attacks against an AI opponent (Meowth). Correct solutions deal damage; incorrect ones miss, allowing the bot to strike back.

This project is built with a **FastAPI backend** and a **Vanilla JavaScript frontend**. It uses the **DeepSeek API** to evaluate code correctness and generate dynamic, Pokémon-style battle commentary.

---

## Features

- Turn-based coding battles between player and AI bot
- Four distinct moves (Quick Attack, Thunder Shock, Slam, Thunderbolt), each mapped to coding problems of increasing difficulty
- Real-time evaluation of player code via DeepSeek API
- Battle log narration in the style of Pokémon games
- HP bar system for both player and bot
- Victory and defeat states based on coding performance

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python (FastAPI)
- **AI Evaluation**: DeepSeek API, I initially tried to use Judge0 API to properly execute the code, but their free tier only allows 50 submissions/day. So I figure why not evaluate with a LLM? It definitely has downsides but it comes with an amazing perks - THE COMMENTARY BATTLE LOGS
- **Deployment**: Render

---

## Project Structure

```
.
├── code-duel-backend/
│   ├── src/
│   │   ├── main.py              # FastAPI app
│   │   └── problem_bank.py      # Problem bank
│   └── .env                     # Contains DEEPSEEK_API_KEY
│
├── code-duel-arena/
│   ├── index.html               # Main UI
│   ├── style.css                # Styling
│   ├── main.js                  # Game logic
│   ├── public/                  # Static assets (sprites, sound)
│   ├── dist/                    # Built frontend files
│   └── package.json             # Vite project config
│
└── README.md
```

---

## Environment Variables

In the `code-duel-backend/.env` file:

```
DEEPSEEK_API_KEY=your_deepseek_api_key
```

The backend reads this value using:

```python
import os

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
```

---

## How to Run Locally

### Backend

```bash
cd code-duel-backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend

```bash
cd code-duel-arena
npm install
npm run dev
```

Ensure the frontend is pointing to the correct backend URL:

```javascript
const API_BASE = "http://localhost:8000";
```

---

## Deployment

### Backend

Deployed on [Render](https://render.com). Set the environment variable:

```
DEEPSEEK_API_KEY=your_key_here
```

### Frontend

Build the frontend:

```bash
cd code-duel-arena
npm run build
```

Then deploy the contents of the `dist/` folder to any static hosting provider like:

- Render (Static Site)
- Netlify
- Vercel
- GitHub Pages

---

## Future Improvements

- Multiplayer support
- Account system with rankings
- More attacks and problem sets
- Battle sprite animations
- Dark mode support

---

## License

This project is intended for educational and hackathon use. Contact the author for other usage or collaboration.
