import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { italic_atom } from "../../atoms";

/**
 * Hooks for using italic text style
 */
export const use_italic = (): [boolean, () => void] => {
  const italic = use_atom_value(italic_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_italic = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  }, [editor]);

  return [italic, toggle_italic];
};
