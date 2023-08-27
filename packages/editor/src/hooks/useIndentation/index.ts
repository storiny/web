import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from "lexical";
import React from "react";

import { canIndentAtom, canOutdentAtom } from "../../atoms";

/**
 * Hooks for using text indentation
 */
export const useIndentation = (): {
  canIndent: boolean;
  canOutdent: boolean;
  indent: () => void;
  outdent: () => void;
} => {
  const [editor] = useLexicalComposerContext();
  const canIndent = useAtomValue(canIndentAtom);
  const canOutdent = useAtomValue(canOutdentAtom);

  const indent = React.useCallback(() => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  const outdent = React.useCallback(() => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  return { indent, outdent, canIndent, canOutdent };
};
