import { registerDragonSupport } from "@lexical/dragon";
import { mergeRegister } from "@lexical/utils";
import type { LexicalEditor } from "lexical";

import { registerRichText } from "../../plugins/rich-text";
import { useLayoutEffect } from "../../utils/useLayoutEffect";

/**
 * Hook for using rich text
 * @param editor Editor
 */
export const useRichText = (editor: LexicalEditor): void => {
  useLayoutEffect(
    () =>
      mergeRegister(registerRichText(editor), registerDragonSupport(editor)),
    [editor]
  );
};
