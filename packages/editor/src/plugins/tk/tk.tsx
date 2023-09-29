import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
import {
  $createTextNode as $create_text_node,
  $getNodeByKey as $get_node_by_key,
  $isParagraphNode as $is_paragraph_node,
  LexicalEditor,
  NodeKey,
  ParagraphNode,
  TextNode
} from "lexical";
import React from "react";

import { $create_tk_node, $is_tk_node, TKNode } from "../../nodes/tk";
import styles from "./tk.module.scss";

type ParagraphNodeKey = NodeKey;
type TKNodeKey = NodeKey;

const TK_TOKEN_REGEX = /(?:\s|^)TK(?:[^a-zA-Z0-9]|$)/g; // Allow punctuations at the end

// Keeps the record of all the TK nodes insde the individual paragraph nodes
const PARAGRAPH_TK_MAP = new Map<ParagraphNodeKey, Set<TKNodeKey>>();

/**
 * Adds a TK node to the paragraph-TK map
 * @param editor Editor
 * @param paragraph_key Parent paragraph key
 * @param tk_node_key TK node key
 */
const $add_tk_node_to_map = (
  editor: LexicalEditor,
  paragraph_key: ParagraphNodeKey,
  tk_node_key: TKNodeKey
): void => {
  const paragraph_map = PARAGRAPH_TK_MAP.get(paragraph_key);

  if (paragraph_map) {
    paragraph_map.add(tk_node_key);
  } else {
    PARAGRAPH_TK_MAP.set(paragraph_key, new Set([tk_node_key]));
  }

  editor.getEditorState().read(() => {
    if ($is_paragraph_node($get_node_by_key(paragraph_key))) {
      const element = editor.getElementByKey(paragraph_key);

      if (element && !element.classList.contains(styles.tk)) {
        element.setAttribute("data-tk-parent", "true");
        element.classList.add(styles.tk);
      }
    }
  });
};

/**
 * Removes a TK node from the paragraph-TK map
 * @param editor Editor
 * @param tk_node TK node
 * @param paragraph_key Paragraph key that overrides parent key
 */
const $remove_tk_node_from_map = (
  editor: LexicalEditor,
  tk_node: TKNode,
  paragraph_key?: NodeKey
): void => {
  const parent_node = tk_node.getParent();

  if (parent_node) {
    const parent_node_key = paragraph_key ?? parent_node.getKey();
    const paragraph_map = PARAGRAPH_TK_MAP.get(parent_node_key);

    if (paragraph_map) {
      paragraph_map.delete(tk_node.getKey());

      if (!paragraph_map.size) {
        PARAGRAPH_TK_MAP.delete(parent_node_key);

        if ($is_paragraph_node(parent_node)) {
          const element = editor.getElementByKey(parent_node_key);

          if (element) {
            element.removeAttribute("data-tk-parent");
            element.classList.remove(styles.tk);
          }
        }
      }
    }
  }
};

/**
 * Text to TK node transformer
 * @param node Text node
 */
const tk_transform = (node: TextNode): void => {
  if ($is_paragraph_node(node.getParent())) {
    const text_content = node.getTextContent();

    if (TK_TOKEN_REGEX.test(text_content)) {
      const index = text_content.indexOf("TK");
      let target_node: TKNode;

      if (index === 0) {
        [target_node] = node.splitText(index + 2);
      } else {
        [, target_node] = node.splitText(index, index + 3);
      }

      if (target_node) {
        // Handle punctuation at the end
        if (target_node.getTextContent().trim().length === 3) {
          [target_node] = target_node.splitText(2);
        }

        target_node.replace($create_tk_node());
      }
    }
  }
};

const TKPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(
    () =>
      merge_register(
        editor.registerNodeTransform<TextNode>(TextNode, tk_transform),
        // Handle TK node mutations
        editor.registerMutationListener(
          TKNode,
          (nodes, { prevEditorState: prev_editor_state }) => {
            for (const [node_key, mutation] of nodes) {
              if (mutation === "created") {
                editor.getEditorState().read(() => {
                  const tk_node = $get_node_by_key<TKNode>(node_key);

                  if (tk_node) {
                    const paragraph_node = tk_node.getParent();

                    if (paragraph_node) {
                      if ($is_paragraph_node(paragraphNode)) {
                        $add_tk_node_to_map(
                          editor,
                          paragraph_node.getKey(),
                          tk_node.getKey()
                        );
                      }
                    }
                  }
                });
              } else if (mutation === "updated") {
                editor.getEditorState().read(() => {
                  const tk_node = $get_node_by_key<TKNode>(node_key);

                  if (tk_node) {
                    const tk_node_key = tk_node.getKey();
                    const paragraph_node = tk_node.getParent();

                    if ($is_paragraph_node(paragraph_node)) {
                      const paragraph_key = paragraph_node.getKey();

                      // TK nodes can move under a different parent paragraph node,
                      // so when they get updated, clean all the previous paragraph
                      // node sets that include this TK node.
                      for (const [
                        paragraph_node_key,
                        paragraph_mode_set
                      ] of PARAGRAPH_TK_MAP.entries()) {
                        if (
                          paragraph_node_key !== paragraph_key &&
                          paragraph_mode_set.has(tk_node_key)
                        ) {
                          $remove_tk_node_from_map(
                            editor,
                            tk_node,
                            paragraph_node_key
                          );
                        }
                      }

                      $add_tk_node_to_map(
                        editor,
                        paragraph_key,
                        tk_node.getKey()
                      );
                    } else {
                      $remove_tk_node_from_map(editor, tk_node);
                      editor.update(
                        () => {
                          tk_node.replace($create_text_node("TK"));
                        },
                        { tag: "history-merge" }
                      );
                    }
                  }
                });
              } else if (mutation === "destroyed") {
                prev_editor_state.read(() => {
                  const tk_node = $get_node_by_key<TKNode>(
                    node_key,
                    prev_editor_state
                  );
                  if (tk_node) {
                    $remove_tk_node_from_map(editor, tk_node);
                  }
                });
              }
            }
          }
        ),
        // Convert the TK node to a text node when the parent paragraph node is changed to
        // something else (for example, a heading node)
        editor.registerMutationListener(
          ParagraphNode,
          (nodes, { dirtyLeaves: dirty_leaves }) => {
            for (const [, mutation] of nodes) {
              if (mutation === "destroyed") {
                editor.update(
                  () => {
                    for (const key of dirty_leaves) {
                      const node = $get_node_by_key(key);

                      if (
                        $is_tk_node(node) &&
                        !$is_paragraph_node(node.getParent())
                      ) {
                        node.replace($create_text_node("TK"));
                      }
                    }
                  },
                  { tag: "history-merge" }
                );
              }
            }
          }
        )
      ),
    [editor]
  );

  return null;
};

export default TKPlugin;
