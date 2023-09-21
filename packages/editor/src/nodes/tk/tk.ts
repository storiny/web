import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  TextNode
} from "lexical";

import styles from "./tk.module.scss";

const TYPE = "tk";
const VERSION = 1;

export class TKNode extends TextNode {
  /**
   * Ctor
   * @param key Node key
   */
  constructor(key?: NodeKey) {
    super("TK", key);
  }

  /**
   * Returns the type of the node
   */
  static override getType(): string {
    return TYPE;
  }

  /**
   * Clones the node
   * @param node Node
   */
  static override clone(node: TKNode): TKNode {
    return new TKNode(node.__key);
  }

  /**
   * Imports node from JSON data
   */
  static importJSON(): TKNode {
    return $createTKNode();
  }
  /**
   * Creates DOM
   * @param config Editor config
   */
  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.setAttribute("spellcheck", "false");
    dom.setAttribute("data-tk-node", "true");
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
    return { ...super.exportJSON(), type: TYPE, version: VERSION };
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
 */
export const $createTKNode = (): TKNode => new TKNode().setMode("token");
