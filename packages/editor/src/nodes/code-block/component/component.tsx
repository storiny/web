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

const CodeBlockEditor = dynamic(() => import("./editor"));

const CodeBlockComponent = ({
  node_key,
  language,
  content,
  title
}: {
  content: YText;
  language: string | null;
  node_key: NodeKey;
  title: string;
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
    <CodeBlockEditor
      content={content}
      language={language}
      node_key={node_key}
      title={title}
    />
  );
};

export default CodeBlockComponent;
