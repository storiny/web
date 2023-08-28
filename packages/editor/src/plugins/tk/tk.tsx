import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, LexicalEditor, NodeKey, TextNode } from "lexical";
import React from "react";

import { $createTKNode, TKNode } from "../../nodes/tk";

const TK_TOKEN_REGEX = /(?:[^a-zA-Z0-9]|^)TK(?:[^a-zA-Z0-9]|$)/g;
const tkSet = new Set<NodeKey>();
const paragraphTkMap = new Map<NodeKey, Set<NodeKey>>();

/**
 * Text to TK node transformer
 * @param editor Editor
 */
const tkTransform =
  (editor: LexicalEditor) =>
  (node: TextNode): void => {
    if (node.getFormat() === 0) {
      const textContent = node.getTextContent();
      const matches = TK_TOKEN_REGEX.exec(textContent);

      if (matches !== null) {
        const index = matches.index;
        let targetNode: TKNode;

        if (index === 0) {
          [targetNode] = node.splitText(index + 2);
        } else {
          [, targetNode] = node.splitText(index + 1, index + 3);
        }

        if (targetNode) {
          const tkNode = $createTKNode(targetNode.getTextContent());
          const parent = targetNode.getParent();

          if (parent && parent.getType() === "paragraph") {
            const map = paragraphTkMap.get(parent.getKey());
            if (map) {
              map.add(`${parseInt(tkNode.getKey()) + 1}`);
            } else {
              paragraphTkMap.set(
                parent.getKey(),
                new Set([`${parseInt(tkNode.getKey()) + 1}`])
              );
            }

            const element = editor.getElementByKey(parent.getKey());

            if (element) {
              element.style.setProperty("background-color", "red");
            }
          }

          targetNode.replace($createTKNode(targetNode.getTextContent()));
        }
      }
    }
  };

/**
 * TK to text node transformer
 * @param editor Editor
 */
const textTransform =
  (editor: LexicalEditor) =>
  (node: TKNode): void => {
    const textContent = node.getTextContent();

    // Skip the transform when it happens for the first
    // time (fires when a new TK node gets created)
    if (tkSet.has(node.getKey()) && !TK_TOKEN_REGEX.test(textContent)) {
      tkSet.delete(node.getKey());

      const parent = node.getParent();

      if (parent && parent.getType() === "paragraph") {
        const map = paragraphTkMap.get(parent.getKey());
        console.log(map, node.getKey());
        if (map) {
          map.delete(node.getKey());
          console.log(map.size);

          const element = editor.getElementByKey(parent.getKey());

          if (element && !map.size) {
            element.style.removeProperty("background-color");
          }
        }
      }

      //    node.replace($createTextNode(textContent));
    }

    // Add the node key to the set at the end of the first call
    tkSet.add(node.getKey());
  };

const TKPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    editor.registerNodeTransform<TextNode>(TextNode, tkTransform(editor));
  }, [editor]);

  // Revert back the text node when the TK is erased
  React.useEffect(
    () => editor.registerNodeTransform<TKNode>(TKNode, textTransform(editor)),
    [editor]
  );

  return null;
};

export default TKPlugin;
