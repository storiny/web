import { addClassNamesToElement, isHTMLElement } from "@lexical/utils";
import {
  $applyNodeReplacement,
  $createParagraphNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  ElementFormatType,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode
} from "lexical";

import { levelToClassNameMap } from "~/components/common/typography";

import styles from "./quote.module.scss";

export type SerializedQuoteNode = SerializedElementNode;

const TYPE = "quote";

export class QuoteNode extends ElementNode {
  /**
   * Ctor
   * @param key Node key
   */
  constructor(key?: NodeKey) {
    super(key);
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
  static clone(node: QuoteNode): QuoteNode {
    return new QuoteNode(node.__key);
  }

  /**
   * Imports node from DOM element
   */
  static importDOM(): DOMConversionMap | null {
    return {
      blockquote: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          const node = $createQuoteNode();

          if (element.style !== null) {
            node.setFormat(element.style.textAlign as ElementFormatType);
          }

          return { node };
        },
        priority: 0
      })
    };
  }

  /**
   * Imports serialized node
   * @param serializedNode Serialized node
   */
  static importJSON(serializedNode: SerializedQuoteNode): QuoteNode {
    const node = $createQuoteNode();
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    return node;
  }

  /**
   * Creates DOM
   */
  createDOM(): HTMLElement {
    const element = document.createElement("blockquote");
    addClassNamesToElement(
      element,
      ...[levelToClassNameMap["quote"], styles.quote]
    );

    return element;
  }

  /**
   * Skip updating the DOM
   */
  updateDOM(): boolean {
    return false;
  }

  /**
   * Exports node to element
   * @param editor Editor
   */
  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) {
        element.append(document.createElement("br"));
      }

      element.style.textAlign = this.getFormatType();
    }

    return {
      element
    };
  }

  /**
   * Serializes the node to JSON
   */
  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
      type: TYPE
    };
  }

  /**
   * Inserts node after the new element
   * @param _ Selection
   * @param restoreSelection Whether to restore the selection
   */
  insertNewAfter(_: RangeSelection, restoreSelection?: boolean): ParagraphNode {
    const newBlock = $createParagraphNode();
    this.insertAfter(newBlock, restoreSelection);
    return newBlock;
  }

  /**
   * Whether to collapse at the start
   */
  collapseAtStart(): true {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }
}

/**
 * Creates a new quote node
 */
export const $createQuoteNode = (): QuoteNode =>
  $applyNodeReplacement(new QuoteNode());

/**
 * Predicate function for determining quote nodes
 * @param node Node
 */
export const $isQuoteNode = (
  node: LexicalNode | null | undefined
): node is QuoteNode => node instanceof QuoteNode;
