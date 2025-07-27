
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";


let editor = new EditorView({
  state: EditorState.create({
    doc: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      python(),
      oneDark
    ]
  }),
  parent: document.getElementById("editor")
});

document.getElementById("submit-code").addEventListener("click", async () => {
  const code = editor.state.doc.toString();  // Get code from CodeMirror 6
  const payload = {
    code: code,
    language: "python",
    player_name: "Ash" // Or dynamically get from player context
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      const battleLog = document.getElementById("battle-log");
      battleLog.innerHTML = `<p>${result.commentary}</p>`;

      if (result.is_correct) {
        reduceHp("player2");
      } else {
        reduceHp("player1");
      }
    } else {
      console.error("Backend error:", result.detail);
      alert("Something went wrong: " + result.detail);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Failed to contact server");
  }
});

function reduceHp(playerId) {
  const hpBar = document.getElementById(`hp-${playerId}`);
  let currentWidth = parseInt(hpBar.style.width) || 100;
  currentWidth = Math.max(currentWidth - 20, 0);
  hpBar.style.width = currentWidth + "%";
  hpBar.style.backgroundColor = currentWidth <= 30 ? "orange" : "green";
}
