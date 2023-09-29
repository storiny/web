import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { REDO_COMMAND, UNDO_COMMAND } from "lexical";
import React from "react";

import { canRedoAtom, canUndoAtom } from "../../atoms";

/**
 * Hooks for using editor history
 */
export const useHistory = (): {
  canRedo: boolean;
  canUndo: boolean;
  redo: () => void;
  undo: () => void;
} => {
  const canUndo = use_atom_value(canUndoAtom);
  const canRedo = use_atom_value(canRedoAtom);
  const [editor] = useLexicalComposerContext();

  const undo = React.useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const redo = React.useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  return { canUndo, canRedo, undo, redo };
};
