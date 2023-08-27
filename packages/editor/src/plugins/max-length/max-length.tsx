import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { trimTextContentFromAnchor } from "@lexical/selection";
import { $restoreEditorState } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  EditorState,
  RootNode
} from "lexical";
import React from "react";

// 5 (average chars / words in english) x 8k words
const MAX_LENGTH = 40_000;

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
        const delCount = textContentSize - MAX_LENGTH;
        const anchor = selection.anchor;

        if (delCount > 0) {
          // Restore the old editor state instead if the last
          // text content was already at the limit.
          if (
            prevTextContentSize === MAX_LENGTH &&
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
