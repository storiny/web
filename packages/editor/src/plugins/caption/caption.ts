import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $createParagraphNode, $getNodeByKey } from "lexical";
import React from "react";

import { $isBlockNode } from "../../nodes/block";
import {
  $createCaptionNode,
  $isCaptionNode,
  CaptionNode
} from "../../nodes/caption";
import { $isFigureNode, FigureNode } from "../../nodes/figure";

/**
 * Caption to paragraph node transformer
 * @param node Caption node
 */
const captionTransform = (node: CaptionNode): void => {
  const previousNode = node.getPreviousSibling();
  const figureNode = node.getParent();

  if ($isFigureNode(figureNode) && !$isBlockNode(previousNode)) {
    // Replace with paragraph node when the captin node is moved out of the figure
    figureNode.insertAfter(node.replace($createParagraphNode(), true));
  }
};

const CaptionPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerNodeTransform<CaptionNode>(
          CaptionNode,
          captionTransform
        ),
        editor.registerMutationListener(CaptionNode, (mutatedNodes) => {
          for (const [nodeKey, mutation] of mutatedNodes) {
            if (mutation === "updated") {
              editor.getEditorState().read(() => {
                const captionNode = $getNodeByKey<CaptionNode>(nodeKey);
                const captionElement = editor.getElementByKey(nodeKey);

                if (captionNode !== null && captionElement !== null) {
                  captionElement.setAttribute(
                    "data-empty",
                    String(captionNode.isEmpty())
                  );
                }
              });
            }
          }
        }),
        editor.registerMutationListener(FigureNode, (mutatedNodes) => {
          for (const [nodeKey, mutation] of mutatedNodes) {
            if (mutation === "updated") {
              editor.update(() => {
                const figureNode = $getNodeByKey<FigureNode>(nodeKey);

                if (figureNode !== null) {
                  const lastChild = figureNode.getLastChildOrThrow();

                  if ($isBlockNode(lastChild)) {
                    // Add the caption node back when it is deleted
                    figureNode.append($createCaptionNode());
                  } else if (!$isCaptionNode(lastChild)) {
                    figureNode.insertAfter(lastChild);
                    figureNode.append($createCaptionNode());
                  }
                }
              });
            }
          }
        })
      ),
    [editor]
  );

  return null;
};

export default CaptionPlugin;
