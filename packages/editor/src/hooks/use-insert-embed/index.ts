import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";

import {
  INSERT_EMBED_COMMAND,
  InsertEmbedPayload
} from "../../plugins/embed/embed";

/**
 * Hook for inserting embed nodes
 */
export const use_insert_embed = (): [(payload: InsertEmbedPayload) => void] => {
  const [editor] = use_lexical_composer_context();

  const insert_embed = React.useCallback(
    (payload: InsertEmbedPayload) => {
      editor.dispatchCommand(INSERT_EMBED_COMMAND, payload);
    },
    [editor]
  );

  return [insert_embed];
};
