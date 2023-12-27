import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { strikethrough_atom } from "../../atoms";

/**
 * Hook for using strikethrough text style
 */
export const use_strikethrough = (): [boolean, () => void] => {
  const strikethrough = use_atom_value(strikethrough_atom);
  const [editor] = use_lexical_composer_context();

  const toggle_strikethrough = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
  }, [editor]);

  return [strikethrough, toggle_strikethrough];
};
