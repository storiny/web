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
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return TYPE;
  }

  static override clone(node: TKNode): TKNode {
    return new TKNode(node.__text, node.__key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.setAttribute("spellcheck", "false");
    dom.classList.add(styles.tk);
    return dom;
  }

  override canInsertTextAfter(): boolean {
    return false;
  }

  override canInsertTextBefore(): boolean {
    return false;
  }

  override isUnmergeable(): boolean {
    return true;
  }

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
