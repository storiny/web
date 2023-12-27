import { EditorState, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { common_extensions } from "../common";

/**
 * Returns the set of code editor extensions for read-only editor.
 */
export const read_only_extensions: Extension[] = [
  ...common_extensions,
  EditorState.readOnly.of(true),
  EditorView.editable.of(false)
];
