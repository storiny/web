import {
  $createParagraphNode as $create_paragraph_node,
  $getRoot as $get_root,
  $getSelection as $get_selection,
  LexicalEditor
} from "lexical";

/**
 * Initializes the editor
 * @param editor Editor
 */
export const initialize_editor = (editor: LexicalEditor): void => {
  editor.update(
    () => {
      const root = $get_root();

      if (root.isEmpty()) {
        const paragraph = $create_paragraph_node();
        root.append(paragraph);
        const { activeElement: active_element } = document;

        if (
          $get_selection() !== null ||
          (active_element !== null &&
            active_element === editor.getRootElement())
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
