import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import React from "react";

/**
 * Hooks for inserting horizontal rule nodes
 */
export const useInsertHorizontalRule = (): [() => void] => {
  const [editor] = useLexicalComposerContext();

  const insertHorizontalRule = React.useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  }, [editor]);

  return [insertHorizontalRule];
};
