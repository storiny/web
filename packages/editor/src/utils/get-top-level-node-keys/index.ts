import { $getRoot, LexicalEditor } from "lexical";

/**
 * Returns the keys of top level editor nodes
 * @param editor Editor
 */
export const getTopLevelNodeKeys = (editor: LexicalEditor): string[] =>
  editor.getEditorState().read(() => $getRoot().getChildrenKeys());
