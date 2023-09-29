import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode } from "lexical";
import React from "react";

import { is_hex_color } from "../../../../ui/src/utils/is-hex-color";

import { $createColorNode } from "../../nodes/color";

/**
 * Text to color node transformer
 * @param node Text node
 */
const colorTransform = (node: TextNode): void => {
  if (node.hasFormat("code")) {
    const textContent = node.getTextContent();

    if (is_hex_color(textContent)) {
      node.replace($createColorNode(textContent));
    }
  }
};

const ColorPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () => editor.registerNodeTransform<TextNode>(TextNode, colorTransform),
    [editor]
  );

  return null;
};

export default ColorPlugin;
