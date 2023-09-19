import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  LexicalEditor
} from "lexical";

/**
 * Initializes the editor
 * @param editor Editor
 */
export const initializeEditor = (editor: LexicalEditor): void => {
  editor.update(
    () => {
      const root = $getRoot();

      if (root.isEmpty()) {
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        const { activeElement } = document;

        if (
          $getSelection() !== null ||
          (activeElement !== null && activeElement === editor.getRootElement())
        ) {
          paragraph.select();
        }
      }
    },
    {
      tag: "history-merge"
    }
  );
};
