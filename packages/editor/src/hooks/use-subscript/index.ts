import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { subscript_atom } from "../../atoms";

/**
 * Hooks for using subscript text style
 */
export const use_subscript = (): [boolean, () => void] => {
  const subscript = use_atom_value(subscript_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_subscript = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
  }, [editor]);

  return [subscript, toggle_subscript];
};
