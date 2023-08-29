import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { $createTextNode, $getRoot, TextNode } from "lexical";
import React from "react";

import { isHexColor } from "~/utils/isHexColor";

import { enableInlineDecoratorsAtom } from "../../atoms";
import { $createColorNode, $isColorNode } from "../../nodes/color";

/**
 * Text to color node transformer
 * @param node Text node
 */
const colorTransform = (node: TextNode): void => {
  if (node.hasFormat("code")) {
    const textContent = node.getTextContent();

    if (isHexColor(textContent)) {
      node.replace($createColorNode(textContent));
    }
  }
};

const ColorPluginImpl = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () => editor.registerNodeTransform<TextNode>(TextNode, colorTransform),
    [editor]
  );

  return null;
};

const ColorPlugin = (): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const firstRenderRef = React.useRef<boolean>(true);
  const enableInlineDecorators = useAtomValue(enableInlineDecoratorsAtom);

  React.useEffect(() => {
    if (!firstRenderRef.current) {
      editor.update(
        () => {
          const textNodes = $getRoot().getAllTextNodes();

          if (enableInlineDecorators) {
            // Create color nodes
            for (const node of textNodes) {
              colorTransform(node);
            }
          } else {
            // Replace color nodes with text nodes
            for (const node of textNodes) {
              if ($isColorNode(node)) {
                node
                  .replace($createTextNode(node.getTextContent()))
                  .setFormat("code");
              }
            }
          }
        },
        { tag: "history-merge" }
      );
    }

    firstRenderRef.current = false;
  }, [enableInlineDecorators, editor]);

  if (!enableInlineDecorators) {
    return null;
  }

  return <ColorPluginImpl />;
};

export default ColorPlugin;
