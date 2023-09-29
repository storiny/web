import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { TextNode } from "lexical";
import React from "react";

import { is_hex_color } from "~/utils/is-hex-color";

import { $create_color_node } from "../../nodes/color";

/**
 * Text to color node transformer
 * @param node Text node
 */
const color_transform = (node: TextNode): void => {
  if (node.hasFormat("code")) {
    const textContent = node.getTextContent();
    if (is_hex_color(textContent)) {
      node.replace($create_color_node(textContent));
    }
  }
};

const ColorPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(
    () => editor.registerNodeTransform<TextNode>(TextNode, color_transform),
    [editor]
  );

  return null;
};

export default ColorPlugin;
