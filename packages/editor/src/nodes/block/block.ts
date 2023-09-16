import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode
} from "lexical";
import React from "react";

import { $isFigureNode } from "../figure";
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
    element.classList.add("flex-center", styles.block);
    element.setAttribute("data-testid", "block-node");
    return element;
  }

  /**
   * Skips updating the DOM
   */
  override updateDOM(): false {
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
   * @param preserveEmptyParent Whether to preserve empty parent
   */
  override remove(preserveEmptyParent?: boolean): void {
    const figureNode = this.getParent();

    // Remove the entire figure node
    if ($isFigureNode(figureNode)) {
      figureNode.remove();
    } else {
      super.remove(preserveEmptyParent);
    }
  }
}

/**
 * Predicate function for determining block nodes
 * @param node Node
 */
export const $isBlockNode = (
  node: LexicalNode | null | undefined
): node is BlockNode => node instanceof BlockNode;
