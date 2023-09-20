import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trimTextContentFromAnchor } from "@lexical/selection";
import { $restoreEditorState } from "@lexical/utils";
import { STORY_MAX_LENGTH } from "@storiny/shared/src/constants/story";
import {
  $getSelection,
  $isRangeSelection,
  EditorState,
  RootNode
} from "lexical";
import React from "react";

const MaxLengthPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    let lastRestoredEditorState: EditorState | null = null;

    return editor.registerNodeTransform(RootNode, (rootNode: RootNode) => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return;
      }

      const prevEditorState = editor.getEditorState();
      const prevTextContentSize = prevEditorState.read(() =>
        rootNode.getTextContentSize()
      );
      const textContentSize = rootNode.getTextContentSize();

      if (prevTextContentSize !== textContentSize) {
        const delCount = textContentSize - STORY_MAX_LENGTH;
        const anchor = selection.anchor;

        if (delCount > 0) {
          // Restore the old editor state instead if the last
          // text content was already at the limit.
          if (
            prevTextContentSize === STORY_MAX_LENGTH &&
            lastRestoredEditorState !== prevEditorState
          ) {
            lastRestoredEditorState = prevEditorState;
            $restoreEditorState(editor, prevEditorState);
          } else {
            trimTextContentFromAnchor(editor, anchor, delCount);
          }
        }
      }
    });
  }, [editor]);

  return null;
};

export default MaxLengthPlugin;
