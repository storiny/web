import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { REDO_COMMAND, UNDO_COMMAND } from "lexical";
import React from "react";

import { can_redo_atom, can_undo_atom } from "../../atoms";

/**
 * Hook for using editor history
 */
export const use_history = (): {
  can_redo: boolean;
  can_undo: boolean;
  redo: () => void;
  undo: () => void;
} => {
  const can_undo = use_atom_value(can_undo_atom);
  const can_redo = use_atom_value(can_redo_atom);
  const [editor] = use_lexical_composer_context();

  const undo = React.useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const redo = React.useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  return { can_undo, can_redo, undo, redo };
};
