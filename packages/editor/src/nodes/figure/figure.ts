import { isHTMLElement as is_html_element } from "@lexical/utils";
import {
  $applyNodeReplacement as $apply_node_replacement,
  DOMExportOutput,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  SerializedElementNode
} from "lexical";

import styles from "./figure.module.scss";

export type SerializedFigureNode = SerializedElementNode;

const TYPE = "figure";
const VERSION = 1;

export class FigureNode extends ElementNode {
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
  static override clone(node: FigureNode): FigureNode {
    return new FigureNode(node.__key);
  }

  /**
   * Imports a serialized node
   */
  static override importJSON(): FigureNode {
    return $create_figure_node();
  }

  /**
   * Creates DOM
   */
  override createDOM(): HTMLElement {
    const element = document.createElement("figure");
    element.classList.add("flex-center", "flex-col", styles.figure);
    element.setAttribute("data-testid", "figure-node");
    return element;
  }

  /**
   * Skips updating the DOM
   */
  override updateDOM(): false {
    return false;
  }

  /**
   * Exports node to element
   * @param editor Editor
   */
  override exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element && is_html_element(element)) {
      if (this.isEmpty()) {
        element.append(document.createElement("br"));
      }
    }

    return {
      element
    };
  }

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Skips setting format
   */
  override setFormat(): this {
    return this;
  }

  /**
   * Returns `false` (block node)
   */
  override isInline(): false {
    return false;
  }

  /**
   * Removes self when there are no children
   */
  override canBeEmpty(): false {
    return false;
  }
}

/**
 * Creates a new figure node
 */
export const $create_figure_node = (): FigureNode =>
  $apply_node_replacement(new FigureNode());

/**
 * Predicate function for determining figure nodes
 * @param node Node
 */
export const $is_figure_node = (
  node: LexicalNode | null | undefined
): node is FigureNode => node instanceof FigureNode;
