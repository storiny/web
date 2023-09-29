import { $insertNodeToNearestRoot as $insert_node_to_nearest_root } from "@lexical/utils";
import {
  $createParagraphNode as $create_paragraph_node,
  LexicalNode
} from "lexical";

import { $create_caption_node } from "../../nodes/caption";
import { $create_figure_node } from "../../nodes/figure";

/**
 * Creates a figure node with caption
 * @param block_node Main entity node of the figure
 * @param caption Initial caption data
 */
export const $create_figure_node_with_caption = (
  block_node: LexicalNode,
  caption?: LexicalNode[] | null
): void => {
  const figure_node = $create_figure_node();
  const caption_node = $create_caption_node();

  if (caption) {
    caption_node.append(...caption);
  }

  figure_node.append(block_node, caption_node);
  $insert_node_to_nearest_root(figure_node).insertAfter(
    $create_paragraph_node()
  );
};
