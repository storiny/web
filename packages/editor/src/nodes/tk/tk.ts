import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  TextNode
} from "lexical";

import styles from "./tk.module.scss";

const TYPE = "tk";

export class TKNode extends TextNode {
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
  static override clone(node: TKNode): TKNode {
    return new TKNode(node.__text, node.__key);
  }

  /**
   * Creates DOM
   * @param config Editor config
   */
  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.setAttribute("spellcheck", "false");
    dom.classList.add(styles.tk);
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
 * Predicate function for determining TK nodes
 * @param node Node
 */
export const $isTKNode = (
  node: LexicalNode | null | undefined
): node is TKNode => node instanceof TKNode;

/**
 * Creates a new TK node
 * @param text Text content
 */
export const $createTKNode = (text: string): TKNode =>
  new TKNode(text).setMode("token");
