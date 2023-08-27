import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

import { strikethroughAtom } from "../../atoms";

/**
 * Hooks for using strikethrough text style
 */
export const useStrikethrough = (): [boolean, () => void] => {
  const strikethrough = useAtomValue(strikethroughAtom);
  const [editor] = useLexicalComposerContext();

  const toggleStrikethrough = React.useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
  }, [editor]);

  return [strikethrough, toggleStrikethrough];
};
