import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

let currentProblem = null;
let selectedMove = null;

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

// Fetch and display a problem based on selected move
async function loadProblemForMove(move) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/problem/${move}`);
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
  if (!currentProblem) {
    alert("Pick a move first to get a problem!");
    return;
  }

  const code = editor.state.doc.toString();

  const payload = {
    code: code,
    language: "python",
    player_name: "Ash",
    // problem_title: currentProblem.title,
    problem_description: currentProblem.description
  };
  console.log("Submitting payload:", payload);


  try {
    const response = await fetch("http://127.0.0.1:8000/commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    const battleLog = document.getElementById("battle-log");
    battleLog.innerHTML = `<p>${result.commentary}</p>`;

    if (result.is_correct) {
      reduceHp("player2");
    } else {
      reduceHp("player1");
    }
  } catch (error) {
    console.error("Submission failed:", error);
    alert("Something went wrong. Try again!");
  }
});

// Move selection logic
document.querySelectorAll(".move-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedMove = btn.dataset.move;
    loadProblemForMove(selectedMove);

    document.querySelectorAll(".move-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

function reduceHp(playerId) {
  const hpBar = document.getElementById(`hp-${playerId}`);
  let currentWidth = parseInt(hpBar.style.width) || 100;
  currentWidth = Math.max(currentWidth - 20, 0);
  hpBar.style.width = currentWidth + "%";
  hpBar.style.backgroundColor = currentWidth <= 30 ? "orange" : "green";
}
