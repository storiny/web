import { EditorState } from "../../../../types";

/**
 * Predicate function for checking whether bindings are enabled
 * @param editorState Editor state
 */
export const isBindingEnabled = (editorState: EditorState): boolean =>
  editorState.isBindingEnabled;
