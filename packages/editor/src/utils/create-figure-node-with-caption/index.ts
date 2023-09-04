import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $createParagraphNode, LexicalNode } from "lexical";

import { $createCaptionNode } from "../../nodes/caption";
import { $createFigureNode } from "../../nodes/figure";

/**
 * Creates a figure node with caption
 * @param blockNode Main entity node of the figure
 * @param caption Initial caption data
 */
export const $createFigureNodeWithCaption = (
  blockNode: LexicalNode,
  caption?: LexicalNode[] | null
): void => {
  const figureNode = $createFigureNode();
  const captionNode = $createCaptionNode();

  if (caption) {
    captionNode.append(...caption);
  }

  figureNode.append(blockNode, captionNode);
  $insertNodeToNearestRoot(figureNode).insertAfter($createParagraphNode());
};
