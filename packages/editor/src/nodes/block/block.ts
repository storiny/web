import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode
} from "lexical";
import React from "react";

import css from "~/theme/main.module.scss";

import { $is_figure_node } from "../figure";
import styles from "./block.module.scss";

export type SerializedBlockNode = SerializedLexicalNode;

const TYPE = "block";
const VERSION = 1;

// noinspection TypeScriptFieldCanBeMadeReadonly
export abstract class BlockNode extends DecoratorNode<React.ReactElement> {
  /**
   * Ctor
   * @param key Node key
   * @protected
   */
  protected constructor(key?: NodeKey) {
    super(key);
  }

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedBlockNode {
    return {
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Creates DOM
   */
  override createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.classList.add(css["flex-center"], styles.block);
    element.setAttribute("data-testid", "block-node");
    return element;
  }

  /**
   * Skips updating the DOM
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override updateDOM(_prev: typeof this): boolean {
    return false;
  }

  /**
   * Marks the node as block node
   */
  override isInline(): false {
    return false;
  }

  /**
   * Called when the node is about to get removed
   * @param preserve_empty_parent Whether to preserve empty parent
   */
  override remove(preserve_empty_parent?: boolean): void {
    const figure_node = this.getParent();

    // Remove the entire figure node
    if ($is_figure_node(figure_node)) {
      figure_node.remove();
    } else {
      super.remove(preserve_empty_parent);
    }
  }
}

/**
 * Predicate function for determining block nodes
 * @param node Node
 */
export const $is_block_node = (
  node: LexicalNode | null | undefined
): node is BlockNode =>
  node instanceof BlockNode ||
  Object.getPrototypeOf(node) === BlockNode.prototype; // Check for derived classes
