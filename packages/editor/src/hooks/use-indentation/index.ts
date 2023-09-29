import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from "lexical";
import React from "react";

import { can_indent_atom, can_outdent_atom } from "../../atoms";

/**
 * Hooks for using text indentation
 */
export const use_indentation = (): {
  can_indent: boolean;
  can_outdent: boolean;
  indent: () => void;
  outdent: () => void;
} => {
  const [editor] = use_lexical_composer_context();
  const can_indent = use_atom_value(can_indent_atom);
  const can_outdent = use_atom_value(can_outdent_atom);

  const indent = React.useCallback(() => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  const outdent = React.useCallback(() => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  return { indent, outdent, can_indent, can_outdent };
};
