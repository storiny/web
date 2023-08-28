import { EditorConfig, LexicalNode, NodeKey, TextNode } from "lexical";

import styles from "./tk.module.scss";

export class TKNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return "tk";
  }

  static override clone(node: TKNode): TKNode {
    return new TKNode(node.__text, node.__key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    //  dom.classList.add("t-body-2", "t-medium", styles.tk);
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
}

/**
 * Predicate function for determining TK nodes
 * @param node Node
 */
export const $isTKNode = (node: LexicalNode | null | undefined): boolean =>
  node instanceof TKNode;

/**
 * Creates a new TK node
 * @param text Text content
 */
export const $createTKNode = (text: string): TKNode => new TKNode(text);
