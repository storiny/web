import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { underline_atom } from "../../atoms";

/**
 * Hooks for using underline text style
 */
export const use_underline = (): [boolean, () => void] => {
  const underline = use_atom_value(underline_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_underline = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  }, [editor]);

  return [underline, toggle_underline];
};
