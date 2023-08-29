import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";

import { INSERT_TEXT_ENTITY_COMMAND } from "../../commands/text-entity";

/**
 * Hooks for inserting emoji text nodes
 */
export const useInsertEmoji = (): [(emoji: string) => void] => {
  const [editor] = useLexicalComposerContext();

  const insertEmoji = React.useCallback(
    (emoji: string) => {
      editor.dispatchCommand(INSERT_TEXT_ENTITY_COMMAND, emoji);
    },
    [editor]
  );

  return [insertEmoji];
};
