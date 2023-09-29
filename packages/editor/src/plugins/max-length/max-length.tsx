import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { trimTextContentFromAnchor as trim_text_content_from_anchor } from "@lexical/selection";
import { $restoreEditorState as $restore_editor_state } from "@lexical/utils";
import { STORY_MAX_LENGTH } from "@storiny/shared/src/constants/story";
import {
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  EditorState,
  RootNode
} from "lexical";
import React from "react";

const MaxLengthPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(() => {
    let last_restored_editor_state: EditorState | null = null;

    return editor.registerNodeTransform(RootNode, (root_node: RootNode) => {
      const selection = $get_selection();

      if (!$is_range_selection(selection) || !selection.isCollapsed()) {
        return;
      }

      const prev_editor_state = editor.getEditorState();
      const prev_text_content_size = prev_editor_state.read(() =>
        root_node.getTextContentSize()
      );
      const text_content_size = root_node.getTextContentSize();

      if (prev_text_content_size !== text_content_size) {
        const del_count = text_content_size - STORY_MAX_LENGTH;
        const anchor = selection.anchor;

        if (del_count > 0) {
          // Restore the old editor state instead if the last text content was already at the limit.
          if (
            prev_text_content_size === STORY_MAX_LENGTH &&
            last_restored_editor_state !== prev_editor_state
          ) {
            last_restored_editor_state = prev_editor_state;
            $restore_editor_state(editor, prev_editor_state);
          } else {
            trim_text_content_from_anchor(editor, anchor, del_count);
          }
        }
      }
    });
  }, [editor]);

  return null;
};

export default MaxLengthPlugin;
