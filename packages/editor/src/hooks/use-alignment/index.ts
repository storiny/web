import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { ElementFormatType, FORMAT_ELEMENT_COMMAND } from "lexical";

import { alignmentAtom, isCaptionSelectionAtom } from "../../atoms";
import { Alignment } from "../../constants";

/**
 * Hook for handling node alignment
 */
export const useAlignment = (): [
  Alignment | undefined,
  (newValue: string) => void,
  boolean
] => {
  const [editor] = useLexicalComposerContext();
  const value = use_atom_value(alignmentAtom);
  const isCaptionSelection = use_atom_value(isCaptionSelectionAtom);

  /**
   * Updates the node alignment
   * @param newValue New alignment
   */
  const setValue = (newValue: string): void => {
    editor.dispatchCommand(
      FORMAT_ELEMENT_COMMAND,
      newValue as ElementFormatType
    );
  };

  return [value, setValue, isCaptionSelection];
};
