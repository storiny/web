import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import React from "react";

import { linkAtom } from "../../atoms";
import { sanitizeUrl } from "../../utils/sanitizeUrl";

/**
 * Hooks for using hyperlinks
 */
export const useLink = (): [boolean, () => void] => {
  const link = useAtomValue(linkAtom);
  const [editor] = useLexicalComposerContext();

  const insertLink = React.useCallback(() => {
    if (!link) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl("https://"));
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, link]);

  return [link, insertLink];
};
