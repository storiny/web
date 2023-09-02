import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";

import {
  INSERT_IMAGE_COMMAND,
  InsertImagePayload
} from "../../plugins/image/image";

/**
 * Hooks for inserting image nodes
 */
export const useInsertImage = (): [(payload: InsertImagePayload) => void] => {
  const [editor] = useLexicalComposerContext();

  const insertImage = React.useCallback(
    (payload: InsertImagePayload) => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    },
    [editor]
  );

  return [insertImage];
};
