import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import { link_atom } from "../../atoms";
import { sanitize_url } from "../../utils/sanitize-url";

/**
 * Hooks for using hyperlinks
 */
export const use_link = (): [boolean, (value?: string) => void] => {
  const link = use_atom_value(link_atom);
  const [editor] = use_lexical_composer_context();

  const insert_link = React.useCallback(
    (value?: string) => {
      if (!link || typeof value === "string") {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitize_url(value || "/"));
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    },
    [editor, link]
  );

  return [link, insert_link];
};
