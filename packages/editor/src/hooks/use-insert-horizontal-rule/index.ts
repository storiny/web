import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import React from "react";

/**
 * Hook for inserting horizontal rule nodes
 */
export const use_insert_horizontal_rule = (): [() => void] => {
  const [editor] = use_lexical_composer_context();

  const insert_horizontal_rule = React.useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  }, [editor]);

  return [insert_horizontal_rule];
};
