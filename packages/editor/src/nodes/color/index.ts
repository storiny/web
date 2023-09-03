import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  TextNode
} from "lexical";

import typographyStyles from "~/components/Typography/Typography.module.scss";

const TYPE = "color";

export class ColorNode extends TextNode {
  /**
   * Ctor
   * @param text Node text
   * @param key Node key
   */
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  /**
   * Returns the type of the node
   */
  static getType(): string {
    return TYPE;
  }

  /**
   * Clones the node
   * @param node Node
   */
  static override clone(node: ColorNode): ColorNode {
    return new ColorNode(node.__text, node.__key);
  }

  /**
   * Creates DOM
   * @param config Editor config
   */
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

  /**
   * Disables inserting text after the node
   */
  override canInsertTextAfter(): boolean {
    return false;
  }

  /**
   * Disables inserting text before the node
   */
  override canInsertTextBefore(): boolean {
    return false;
  }

  /**
   * Makes the node unmergeable into sibling text nodes
   */
  override isUnmergeable(): boolean {
    return true;
  }

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedTextNode {
    return { ...super.exportJSON(), type: TYPE };
  }
}

/**
 * Predicate function for determining color nodes
 * @param node Node
 */
export const $isColorNode = (
  node: LexicalNode | null | undefined
): node is ColorNode => node instanceof ColorNode;

/**
 * Creates a new color node
 * @param color Color
 */
export const $createColorNode = (color: string): ColorNode =>
  new ColorNode(color).setMode("token").setFormat("code");
