import { registerDragonSupport as register_dragon_support } from "@lexical/dragon";
import { mergeRegister as merge_register } from "@lexical/utils";
import type { LexicalEditor } from "lexical";

import { register_rich_text } from "../../plugins/rich-text";
import { use_layout_effect } from "../use-layout-effect";

/**
 * Hook for using rich text
 * @param editor Editor
 */
export const use_rich_text = (editor: LexicalEditor): void => {
  use_layout_effect(
    () =>
      merge_register(
        register_rich_text(editor),
        register_dragon_support(editor)
      ),
    [editor]
  );
};
