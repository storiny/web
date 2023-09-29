import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { italicAtom } from "../../atoms";

/**
 * Hooks for using italic text style
 */
export const useItalic = (): [boolean, () => void] => {
  const italic = use_atom_value(italicAtom);
  const [editor] = useLexicalComposerContext();

  const toggleItalic = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  }, [editor]);

  return [italic, toggleItalic];
};
