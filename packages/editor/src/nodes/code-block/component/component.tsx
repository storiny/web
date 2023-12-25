import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection as use_lexical_node_selection } from "@lexical/react/useLexicalNodeSelection";
import {
  $getNodeByKey as $get_node_by_key,
  $getSelection as $get_selection,
  $isNodeSelection as $is_node_selection,
  BaseSelection,
  NodeKey
} from "lexical";
import dynamic from "next/dynamic";
import React from "react";
import { useHotkeys as use_hot_keys } from "react-hotkeys-hook";
import { Text as YText } from "yjs";

import { $is_code_block_node } from "../code-block";
import styles from "./code-block.module.scss";

const CodeBlockEditor = dynamic(() => import("./editor"));

const CodeBlockComponent = ({
  node_key,
  language,
  line_count,
  collab_text
}: {
  collab_text: YText;
  language: string | null;
  line_count: number;
  node_key: NodeKey;
}): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();
  const [selected, set_selected] = use_lexical_node_selection(node_key);
  const [selection, set_selection] = React.useState<BaseSelection | null>(null);

  use_hot_keys(
    "backspace,delete",
    (event) => {
      if (selected && $is_node_selection(selection)) {
        event.preventDefault();
        set_selected(false);

        editor.update(() => {
          const node = $get_node_by_key(node_key);
          if ($is_code_block_node(node)) {
            node.remove();
          }
        });
      }
    },
    { enableOnContentEditable: true }
  );

  const editable = editor.isEditable();

  /**
   * Changes the language of the code inside the block
   */
  const change_language = React.useCallback(
    (language: string | null) => {
      editor.update(() => {
        const node = $get_node_by_key(node_key);
        if ($is_code_block_node(node)) {
          node.set_language(language);
        }
      });
    },
    [editor, node_key]
  );

  React.useEffect(() => {
    let is_mounted = true;

    const unregister = editor.registerUpdateListener(
      ({ editorState: editor_state }) => {
        if (is_mounted) {
          set_selection(editor_state.read($get_selection));
        }
      }
    );

    return () => {
      is_mounted = false;
      unregister();
    };
  }, [editor]);

  return (
    <div className={styles["code-block"]}>
      <CodeBlockEditor collab_text={collab_text} node_key={node_key} />
    </div>
  );
};

export default CodeBlockComponent;
