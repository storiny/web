import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";

import {
  INSERT_EMBED_COMMAND,
  InsertEmbedPayload
} from "../../plugins/embed/embed";

/**
 * Hooks for inserting embed nodes
 */
export const useInsertEmbed = (): [(payload: InsertEmbedPayload) => void] => {
  const [editor] = useLexicalComposerContext();

  const insertEmbed = React.useCallback(
    (payload: InsertEmbedPayload) => {
      editor.dispatchCommand(INSERT_EMBED_COMMAND, payload);
    },
    [editor]
  );

  return [insertEmbed];
};
