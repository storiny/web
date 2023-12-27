import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { superscript_atom } from "../../atoms";

/**
 * Hook for using superscript text style
 */
export const use_superscript = (): [boolean, () => void] => {
  const superscript = use_atom_value(superscript_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_superscript = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
  }, [editor]);

  return [superscript, toggle_superscript];
};
