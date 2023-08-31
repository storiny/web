import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import React from "react";

import { linkAtom } from "../../atoms";
import { sanitizeUrl } from "../../utils/sanitize-url";

/**
 * Hooks for using hyperlinks
 */
export const useLink = (): [boolean, (value?: string) => void] => {
  const link = useAtomValue(linkAtom);
  const [editor] = useLexicalComposerContext();

  const insertLink = React.useCallback(
    (value?: string) => {
      if (!link || typeof value === "string") {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(value || "/"));
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    },
    [editor, link]
  );

  return [link, insertLink];
};
