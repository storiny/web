import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";

import { INSERT_TEXT_ENTITY_COMMAND } from "../../commands/text-entity";

/**
 * Hook for inserting emoji text nodes
 */
export const use_insert_text_entity = (): [(entity: string) => void] => {
  const [editor] = use_lexical_composer_context();

  const insert_text_entity = React.useCallback(
    (entity: string) => {
      editor.dispatchCommand(INSERT_TEXT_ENTITY_COMMAND, entity);
    },
    [editor]
  );

  return [insert_text_entity];
};
