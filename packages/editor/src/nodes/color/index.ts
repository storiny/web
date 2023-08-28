import { EditorConfig, LexicalNode, NodeKey, TextNode } from "lexical";

import typographyStyles from "~/components/Typography/Typography.module.scss";

export class ColorNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return "color";
  }

  static override clone(node: ColorNode): ColorNode {
    return new ColorNode(node.__text, node.__key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    const codeNode = dom.children[0] as HTMLElement;

    if (codeNode) {
      codeNode.style.setProperty("--color", this.getTextContent());
      codeNode.classList.add(
        typographyStyles["inline-color"],
        typographyStyles.legible
      );
    }

    return dom;
  }
}

/**
 * Predicate function for determining color nodes
 * @param node Node
 */
export const $isColorNode = (node: LexicalNode | null | undefined): boolean =>
  node instanceof ColorNode;

/**
 * Creates a new color node
 * @param color Color
 */
export const $createColorNode = (color: string): ColorNode =>
  new ColorNode(color).setMode("token").setFormat("code");
