
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";


editor = new EditorView({
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


