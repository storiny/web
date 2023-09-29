import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { codeAtom } from "../../atoms";

/**
 * Hooks for using code text style
 */
export const useCode = (): [boolean, () => void] => {
  const code = use_atom_value(codeAtom);
  const [editor] = useLexicalComposerContext();

  const toggleCode = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
  }, [editor]);

  return [code, toggleCode];
};
