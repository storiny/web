import { $canShowPlaceholderCurry as $can_show_placeholder_curry } from "@lexical/text";
import { mergeRegister as merge_register } from "@lexical/utils";
import { LexicalEditor } from "lexical";
import React from "react";

import { use_layout_effect } from "../use-layout-effect";

/**
 * Predicate function for determining whether the placeholder can
 * be rendered from the current editor state
 * @param editor Editor
 */
const can_show_placeholder_from_current_editor_state = (
  editor: LexicalEditor
): boolean =>
  editor
    .getEditorState()
    .read($can_show_placeholder_curry(editor.isComposing()));

/**
 * Hook for determining placeholder visibility
 * @param editor Editor
 */
export const use_can_show_placeholder = (editor: LexicalEditor): boolean => {
  const [can_show_placeholder, set_can_show_placeholder] = React.useState(() =>
    can_show_placeholder_from_current_editor_state(editor)
  );

  use_layout_effect(() => {
    const reset_can_show_placeholder = (): void => {
      set_can_show_placeholder(
        can_show_placeholder_from_current_editor_state(editor)
      );
    };

    reset_can_show_placeholder();

    return merge_register(
      editor.registerUpdateListener(reset_can_show_placeholder),
      editor.registerEditableListener(reset_can_show_placeholder)
    );
  }, [editor]);

  return can_show_placeholder;
};
