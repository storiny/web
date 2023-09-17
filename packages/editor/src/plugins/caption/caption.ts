import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $getNodeByKey, LexicalNode } from "lexical";
import React from "react";

import { $isBlockNode } from "../../nodes/block";
import {
  $createCaptionNode,
  $isCaptionNode,
  CaptionNode
} from "../../nodes/caption";
import { FigureNode } from "../../nodes/figure";

const CaptionPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () =>
      mergeRegister(
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
        editor.registerMutationListener(
          FigureNode,
          (mutatedNodes, { updateTags }) => {
            if (!updateTags.has("collaboration")) {
              for (const [nodeKey, mutation] of mutatedNodes) {
                if (mutation === "updated") {
                  editor.update(() => {
                    const figureNode = $getNodeByKey<FigureNode>(nodeKey);

                    if (figureNode !== null) {
                      const $isFirstChild = (node: LexicalNode): boolean =>
                        node.getIndexWithinParent() === 0;

                      for (const node of figureNode.getChildren()) {
                        if (
                          ($isBlockNode(node) && !$isFirstChild(node)) || // Block node should be the first child of the figure node
                          (!$isBlockNode(node) && !$isCaptionNode(node)) // The last child should always be a caption node
                        ) {
                          figureNode.insertAfter(node);
                        }
                      }

                      if (!$isCaptionNode(figureNode.getLastChild())) {
                        figureNode.append($createCaptionNode());
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
