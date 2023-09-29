import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
import { $getNodeByKey as $get_node_by_key, LexicalNode } from "lexical";
import React from "react";

import { $is_block_node } from "../../nodes/block";
import {
  $create_caption_node,
  $is_caption_node,
  CaptionNode
} from "../../nodes/caption";
import { FigureNode } from "../../nodes/figure";

const CaptionPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(
    () =>
      merge_register(
        editor.registerMutationListener(CaptionNode, (mutated_nodes) => {
          for (const [node_key, mutation] of mutated_nodes) {
            if (mutation === "updated") {
              editor.getEditorState().read(() => {
                const caption_node = $get_node_by_key<CaptionNode>(node_key);
                const caption_element = editor.getElementByKey(node_key);

                if (caption_node !== null && caption_element !== null) {
                  caption_element.setAttribute(
                    "data-empty",
                    String(caption_node.isEmpty())
                  );
                }
              });
            }
          }
        }),
        editor.registerMutationListener(
          FigureNode,
          (mutated_nodes, { updateTags: update_tags }) => {
            if (!update_tags.has("collaboration")) {
              for (const [node_key, mutation] of mutated_nodes) {
                if (mutation === "updated") {
                  editor.update(() => {
                    const figure_node = $get_node_by_key<FigureNode>(node_key);

                    if (figure_node !== null) {
                      const $is_first_child = (node: LexicalNode): boolean =>
                        node.getIndexWithinParent() === 0;

                      for (const node of figure_node.getChildren()) {
                        if (
                          ($is_block_node(node) && !$is_first_child(node)) || // Block node should be the first child of the figure node
                          (!$is_block_node(node) && !$is_caption_node(node)) // The last child should always be a caption node
                        ) {
                          figure_node.insertAfter(node);
                        }
                      }

                      if (!$is_caption_node(figure_node.getLastChild())) {
                        figure_node.append($create_caption_node());
                      }
                    }
                  });
                }
              }
            }
          }
        )
      ),
    [editor]
  );

  return null;
};

export default CaptionPlugin;
