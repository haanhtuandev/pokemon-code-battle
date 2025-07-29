# Pokemon Code Battle

**Pokemon Code Battle** is a gamified coding battle platform inspired by the classic Pokémon battle interface. Players solve programming problems to launch attacks against an AI opponent (Meowth). Correct solutions deal damage; incorrect ones miss, allowing the bot to strike back.

This project is built with a **FastAPI backend** and a **Vanilla JavaScript frontend**. It uses the **DeepSeek API** to evaluate code correctness and generate dynamic, Pokémon-style battle commentary. Check it out right now: [Demo right here](https://pokemon-code-battle.netlify.app)

<p align="center">
  <img width=50% width="897" height="1083" alt="The UI of Pokemon Code Battle" src="https://github.com/user-attachments/assets/8fa6d86d-fd54-4bd5-a21c-f9edaa721898" />
</p>


## Features

- Turn-based coding battles between player and AI bot
- Four distinct moves (Quick Attack, Thunder Shock, Slam, Thunderbolt), each mapped to coding problems of increasing difficulty
- Real-time evaluation of player code via DeepSeek API
- Battle log narration in the style of Pokémon games
- HP bar system for both player and bot
- Victory and defeat states based on coding performance

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, CodeMirror for the code editor
- **Backend**: Python (FastAPI)
- **AI Evaluation**: DeepSeek API, I initially tried to use Judge0 API to properly execute the code, but their free tier only allows 50 submissions/day. So I figure why not evaluate with a LLM? It definitely has downsides but it comes with an amazing perks - THE COMMENTARY BATTLE LOGS
- **Deployment**: Render, Netlify

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
│   ├── public/
│   ├──src/
│        ├── style.css           # Styling
│        ├── main.js                 
│   ├── dist/                    # Built frontend files
│   └── package.json             # Vite project config
│
└── README.md
```

---

## How to Run Locally

This project is already deployed with a live backend API. If you'd like to run the frontend locally and connect to the hosted backend, follow the steps below.

### Prerequisites

- Node.js (v16 or later recommended)
- npm

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/haanhtuandev/pokemon-code-battle
   cd pokemon-code-battle/code-duel-arena
  <p align="center"><img width="645" height="126" alt="Screenshot 2025-07-29 at 00 40 11" src="https://github.com/user-attachments/assets/782b2e66-c853-4df5-9ab7-05a77620686a" /></p>
  

2. **Install Dependencies**
    ```bash
    npm install
  <p align="center"><img width="369" height="118" alt="Screenshot 2025-07-29 at 00 40 42" src="https://github.com/user-attachments/assets/40ba54c5-835f-4f88-8af7-ff259d68c014" /></p>
  
  
3. **Run The Development Server**
    ```bash
    
    npm run dev

  Then open http://localhost:[PORT] in your browser.
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
