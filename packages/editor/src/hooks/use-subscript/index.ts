import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { subscriptAtom } from "../../atoms";

/**
 * Hooks for using subscript text style
 */
export const useSubscript = (): [boolean, () => void] => {
  const subscript = use_atom_value(subscriptAtom);
  const [editor] = useLexicalComposerContext();

  const toggleSubscript = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
  }, [editor]);

  return [subscript, toggleSubscript];
};
