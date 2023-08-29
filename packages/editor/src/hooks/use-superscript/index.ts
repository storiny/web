import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { superscriptAtom } from "../../atoms";

/**
 * Hooks for using superscript text style
 */
export const useSuperscript = (): [boolean, () => void] => {
  const superscript = useAtomValue(superscriptAtom);
  const [editor] = useLexicalComposerContext();

  const toggleSuperscript = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
  }, [editor]);

  return [superscript, toggleSuperscript];
};
