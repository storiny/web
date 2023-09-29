import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { boldAtom } from "../../atoms";

/**
 * Hooks for using bold text style
 */
export const useBold = (): [boolean, () => void] => {
  const bold = use_atom_value(boldAtom);
  const [editor] = useLexicalComposerContext();

  const toggleBold = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  }, [editor]);

  return [bold, toggleBold];
};
