import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";



const API_BASE = "https://pokemon-code-battle.onrender.com";
let currentProblem = null;
let selectedMove = null;
// Audio elements
const bgm = document.getElementById("bgm");
const damageSfx = document.getElementById("damage-sfx");
const winSfx = document.getElementById("win-sfx");
const loseSfx = document.getElementById("lose-sfx");
let isBgmPlaying = false; // Track BGM state
let isToggling = false; // Debounce toggle
// Initialize CodeMirror
let editor = new EditorView({
  state: EditorState.create({
    doc: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      python(),
      oneDark
    ]
  }),
  parent: document.getElementById("editor")
});



async function resetGame() {
  try {
    const response = await fetch(`${API_BASE}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Game reset:", result);

    // Explicitly hide game-over modal
    const modal = document.getElementById("game-over-modal");
    modal.classList.add("hidden");

    // Reset HP bars
    updateHp("player", 100);
    updateHp("bot", 100);

    // Clear battle log with typewriter effect
    const battleLog = document.getElementById("battle-log");
    await typewriter(battleLog, "Welcome to the Pokémon Code Duel Arena!");

    // Enable move buttons, disable submit button
    setMoveButtonsEnabled(true);
    document.getElementById("submit-code").disabled = true;

    // Clear move and problem
    selectedMove = null;
    currentProblem = null;

    // Remove selection from move buttons
    document.querySelectorAll(".move-btn").forEach(b => b.classList.remove("selected"));

    // Clear problem text
    document.getElementById("problem-text").innerHTML = "Select a move to get a coding challenge!";

    // Reset editor
    editor.setState(EditorState.create({
      doc: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        python(),
        oneDark
      ]
    }));

    // Reset timer
    clearInterval(timerInterval);
    document.getElementById("timer").textContent = "Time Left: 1:30";

    // Reset BGM state
    if (isBgmPlaying) {
      bgm.pause();
      bgm.currentTime = 0;
      isBgmPlaying = false;
      document.getElementById("music-toggle").textContent = "Toggle Music: OFF";
    }
  } catch (error) {
    console.error("Failed to reset game:", error);
    alert("Failed to reset game. Please refresh the page.");
    const modal = document.getElementById("game-over-modal");
    modal.classList.add("hidden");
  }
}
// Update your existing showGameOverModal function to use the reset
function showGameOverModal(message) {
  const modal = document.getElementById("game-over-modal");
  const msgElem = document.getElementById("game-over-message");

  msgElem.textContent = message;
  modal.classList.remove("hidden");

  // Play win/lose sound
  const sfx = message.includes("defeated Meowth") ? winSfx : loseSfx;
  sfx.play().catch(err => console.log("Game over SFX error:", err));

  // Pause BGM if playing
  if (isBgmPlaying) {
    bgm.pause();
    isBgmPlaying = false;
    document.getElementById("music-toggle").textContent = "Toggle Music: OFF";
  }

  // Remove existing listeners to prevent duplicates
  const restartBtn = document.getElementById("restart-btn");
  const newRestartBtn = restartBtn.cloneNode(true);
  restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);

  newRestartBtn.addEventListener("click", async () => {
    modal.classList.add("hidden");
    await resetGame();
  });
}

// You can also add a manual reset button to your HTML and connect it like this:
// document.getElementById("manual-reset-btn").addEventListener("click", resetGame);

// Optional: Call resetGame when the page loads to ensure clean state
document.addEventListener("DOMContentLoaded", () => {
  resetGame();
});
// Fetch and display a problem based on selected move
async function loadProblemForMove(move) {
  try {
    const response = await fetch(`${API_BASE}/problem/${move}`);
    const problem = await response.json();
    currentProblem = problem;

    const problemText = document.getElementById("problem-text");
    problemText.innerHTML = `
      ${problem.description.replace(/\n/g, "<br/>")}
    `;
    editor.setState(EditorState.create({
        doc: currentProblem.starter_code,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          python(),
          oneDark
        ]
      }));
  } catch (err) {
    console.error("Failed to load problem:", err);
    alert("Could not load problem for this move.");
  }
}




// Submit code to backend and handle response
document.getElementById("submit-code").addEventListener("click", async () => {
  if (!currentProblem || !selectedMove) {
    alert("Pick a move first to get a problem!");
    return;
  }
  clearInterval(timerInterval);

  const submitButton = document.getElementById("submit-code");
  submitButton.classList.add("processing");
  submitButton.disabled = true;

  const code = editor.state.doc.toString();

  const payload = {
    code: code,
    language: "python",
    player_name: "Ash",
    move: selectedMove,
    problem_description: currentProblem.description
  };

  try {
    const response = await fetch(`${API_BASE}/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    submitButton.classList.remove("processing");
    clearInterval(timerInterval);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    
    // Display player's commentary with typewriter effect
    const battleLog = document.getElementById("battle-log");
    await typewriter(battleLog, result.player_commentary);

    // Update BOT HP immediately if player hit
    if (result.player_hit) {
      updateHp("bot", result.bot_hp);
    
      if (result.bot_hp <= 0) {
        await typewriter(battleLog, "You won the battle! The enemy fainted!");
        showGameOverModal("You defeated Meowth!");
        submitButton.disabled = true;
        return;
      }
    }

    // Delay bot commentary and only apply bot's HP change *after*
    setTimeout(async () => {
      await typewriter(battleLog, result.bot_commentary);
    
      if (result.bot_hit) {
        updateHp("player", result.player_hp);
    
        if (result.player_hp <= 0) {
          await typewriter(battleLog, "Pikachu fainted!");
          document.getElementById("submit-code").disabled = true;
          showGameOverModal("You disappointed Pikachu!");
          return;
        }
      }
      
      // Re-enable move selection for next turn
      if (result.player_hp > 0 && result.bot_hp > 0) {
        setMoveButtonsEnabled(true);
        submitButton.disabled = true;
        
        selectedMove = null;
        currentProblem = null;
        document.querySelectorAll(".move-btn").forEach(b => b.classList.remove("selected"));
        
        document.getElementById("problem-text").innerHTML = "Select a move to get a coding challenge!";
        
        editor.setState(EditorState.create({
          doc: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
          extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            python(),
            oneDark
          ]
        }));
      }
    }, 10000);

  } catch (error) {
    console.error("Turn failed:", error);
    alert("Something went wrong with the turn.");
    submitButton.classList.remove("processing");
    setMoveButtonsEnabled(true);
    submitButton.disabled = true;
  }
});
// Move selection logic
document.querySelectorAll(".move-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Prevent selection if buttons are disabled
    if (btn.disabled) return;
    
    selectedMove = btn.dataset.move;
    loadProblemForMove(selectedMove);

    document.querySelectorAll(".move-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    
    // Disable all move buttons after selection
    setMoveButtonsEnabled(false);
    
    // Enable submit button and start timer
    document.getElementById("submit-code").disabled = false;
    startTimer();
  });
});

function updateHp(playerId, newHp) {
  const hpBar = document.getElementById(`hp-${playerId}`);
  const hpText = document.getElementById(`hp-text-${playerId}`);
  const clampedHp = Math.max(0, Math.min(newHp, 100)); // Ensure 0–100
  hpBar.style.width = `${clampedHp}%`;
  hpBar.style.backgroundColor = clampedHp <= 30 ? "orange" : "green";
  hpText.textContent = `${clampedHp}%`;

  // Trigger damage animation and sound if HP decreased
  const sprite = document.querySelector(`.sprite-${playerId === "player" ? "left" : "right"} img`);
  if (clampedHp < parseFloat(hpText.dataset.previousHp || 100)) {
    sprite.classList.add("damaged");
    damageSfx.play().catch(err => console.log("Damage SFX error:", err));
    setTimeout(() => {
      sprite.classList.remove("damaged");
    }, 500); // Match animation duration
  }
  hpText.dataset.previousHp = clampedHp; // Store current HP for comparison
}

let timerInterval = null;
let timeLeft = 90;
function startTimer() {
  clearInterval(timerInterval); // Clear any previous timer
  timeLeft = 90;

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(1, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById("timer").textContent = `Time Left: ${minutes}:${seconds}`;
}
function handleTimeout() {
  alert("Time's up! You missed your move.");

  const battleLog = document.getElementById("battle-log");
  typewriter(battleLog, "Your move timed out!").then(() => {
    // Trigger BOT's turn
    fetch(`${API_BASE}/bot-turn`)
      .then(res => res.json())
      .then(result => {
        typewriter(battleLog, result.bot_commentary).then(() => {
          if (result.bot_hit) {
            updateHp("player", result.player_hp);
            
            if (result.player_hp <= 0) {
              typewriter(battleLog, "Pikachu fainted!");
              document.getElementById("submit-code").disabled = true;
              return;
            }
          }
          
          // Re-enable move selection after timeout turn
          setMoveButtonsEnabled(true);
          document.getElementById("submit-code").disabled = true;
          
          selectedMove = null;
          currentProblem = null;
          document.querySelectorAll(".move-btn").forEach(b => b.classList.remove("selected"));
          document.getElementById("problem-text").innerHTML = "Select a move to get a coding challenge!";
        });
      })
      .catch(error => {
        console.error("Bot turn failed:", error);
        setMoveButtonsEnabled(true);
      });
  });
}


function setMoveButtonsEnabled(enabled) {
  document.querySelectorAll(".move-btn").forEach(btn => {
    if (enabled) {
      btn.disabled = false;
      btn.classList.remove("disabled");
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
  });
}
// Reusable typewriter function
function typewriter(element, text, speed = 50) {
  return new Promise((resolve) => {
    element.innerHTML = ""; // Clear existing content
    element.classList.add("typing"); // Add typing class for cursor

    // Split text into characters for precise control
    const chars = text.split("");
    let i = 0;
    let htmlContent = "";

    function type() {
      if (i < chars.length) {
        htmlContent += chars[i];
        // Wrap in <p> and preserve newlines
        element.innerHTML = `<p>${htmlContent.replace(/\n/g, "<br>")}</p>`;
        i++;
        setTimeout(type, speed);
      } else {
        element.classList.remove("typing"); // Remove cursor
        resolve(); // Resolve when typing is complete
      }
    }
    type();
  });
}

// Music toggle with debounce
document.getElementById("music-toggle").addEventListener("click", () => {
  if (isToggling) return; // Prevent rapid clicks
  isToggling = true;

  setTimeout(() => {
    isToggling = false; // Reset debounce after 500ms
  }, 500);

  if (!isBgmPlaying) {
    bgm.play().then(() => {
      isBgmPlaying = true;
      document.getElementById("music-toggle").textContent = "Toggle Music: ON";
    }).catch(err => {
      console.error("BGM play error:", err);
      alert("Failed to play music. Please try again.");
    });
  } else {
    bgm.pause();
    isBgmPlaying = false;
    document.getElementById("music-toggle").textContent = "Toggle Music: OFF";
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("game-over-modal");
  modal.classList.add("hidden");
  resetGame();
});