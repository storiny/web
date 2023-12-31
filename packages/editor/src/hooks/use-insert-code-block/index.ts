import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";

import {
  INSERT_CODE_BLOCK_COMMAND,
  InsertCodeBlockPayload
} from "../../plugins/code-block/code-block";

/**
 * Hook for inserting code block nodes
 */
export const use_insert_code_block = (): [
  (payload: InsertCodeBlockPayload) => void
] => {
  const [editor] = use_lexical_composer_context();

  const insert_code_block = React.useCallback(
    (payload: InsertCodeBlockPayload) => {
      editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, payload);
    },
    [editor]
  );

  return [insert_code_block];
};
