import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { underlineAtom } from "../../atoms";

/**
 * Hooks for using underline text style
 */
export const useUnderline = (): [boolean, () => void] => {
  const underline = use_atom_value(underlineAtom);
  const [editor] = useLexicalComposerContext();

  const toggleUnderline = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  }, [editor]);

  return [underline, toggleUnderline];
};
