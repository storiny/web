import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useAtomValue as use_atom_value } from "jotai";
import { ElementFormatType, FORMAT_ELEMENT_COMMAND } from "lexical";

import { alignment_atom, is_caption_selection_atom } from "../../atoms";
import { Alignment } from "../../constants";

/**
 * Hook for handling node alignment
 */
export const use_alignment = (): [
  Alignment | undefined,
  (next_value: string) => void,
  boolean
] => {
  const [editor] = use_lexical_composer_context();
  const value = use_atom_value(alignment_atom);
  const is_caption_selection = use_atom_value(is_caption_selection_atom);

  /**
   * Updates the node alignment
   * @param next_value New alignment
   */
  const set_value = (next_value: string): void => {
    editor.dispatchCommand(
      FORMAT_ELEMENT_COMMAND,
      next_value as ElementFormatType
    );
  };

  return [value, set_value, is_caption_selection];
};
