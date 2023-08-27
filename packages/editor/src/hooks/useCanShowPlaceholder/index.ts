import { $canShowPlaceholderCurry } from "@lexical/text";
import { mergeRegister } from "@lexical/utils";
import { LexicalEditor } from "lexical";
import React from "react";

import { useLayoutEffect } from "../../utils/useLayoutEffect";

/**
 * Predicate function for determining whether the placeholder can
 * be rendered from the current editor state
 * @param editor Editor
 */
const canShowPlaceholderFromCurrentEditorState = (
  editor: LexicalEditor
): boolean =>
  editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()));

/**
 * Hook for determining placeholder visibility
 * @param editor Editor
 */
export const useCanShowPlaceholder = (editor: LexicalEditor): boolean => {
  const [canShowPlaceholder, setCanShowPlaceholder] = React.useState(() =>
    canShowPlaceholderFromCurrentEditorState(editor)
  );

  useLayoutEffect(() => {
    const resetCanShowPlaceholder = (): void => {
      const currentCanShowPlaceholder =
        canShowPlaceholderFromCurrentEditorState(editor);
      setCanShowPlaceholder(currentCanShowPlaceholder);
    };

    resetCanShowPlaceholder();

    return mergeRegister(
      editor.registerUpdateListener(() => {
        resetCanShowPlaceholder();
      }),
      editor.registerEditableListener(() => {
        resetCanShowPlaceholder();
      })
    );
  }, [editor]);

  return canShowPlaceholder;
};
