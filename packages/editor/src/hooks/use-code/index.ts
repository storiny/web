import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { code_atom } from "../../atoms";

/**
 * Hooks for using code text style
 */
export const use_code = (): [boolean, () => void] => {
  const code = use_atom_value(code_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_code = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
  }, [editor]);

  return [code, toggle_code];
};
