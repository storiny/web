import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";

import {
  INSERT_IMAGE_COMMAND,
  InsertImagePayload
} from "../../plugins/image/image";

/**
 * Hook for inserting image nodes
 */
export const use_insert_image = (): [(payload: InsertImagePayload) => void] => {
  const [editor] = use_lexical_composer_context();

  const insert_image = React.useCallback(
    (payload: InsertImagePayload) => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    },
    [editor]
  );

  return [insert_image];
};
