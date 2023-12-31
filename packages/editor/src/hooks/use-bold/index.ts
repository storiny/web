import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { bold_atom } from "../../atoms";

/**
 * Hook for using bold text style
 */
export const use_bold = (): [boolean, () => void] => {
  const bold = use_atom_value(bold_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_bold = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  }, [editor]);

  return [bold, toggle_bold];
};
