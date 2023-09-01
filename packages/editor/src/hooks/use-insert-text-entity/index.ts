import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";

import { INSERT_TEXT_ENTITY_COMMAND } from "../../commands/text-entity";

/**
 * Hooks for inserting emoji text nodes
 */
export const useInsertTextEntity = (): [(entity: string) => void] => {
  const [editor] = useLexicalComposerContext();

  const insertTextEntity = React.useCallback(
    (entity: string) => {
      editor.dispatchCommand(INSERT_TEXT_ENTITY_COMMAND, entity);
    },
    [editor]
  );

  return [insertTextEntity];
};
