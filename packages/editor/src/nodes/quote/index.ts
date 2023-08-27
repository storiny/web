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

export type SerializedQuoteNode = SerializedElementNode;

const TYPE = "quote";

export class QuoteNode extends ElementNode {
  constructor(key?: NodeKey) {
    super(key);
  }

  static getType(): string {
    return TYPE;
  }

  static clone(node: QuoteNode): QuoteNode {
    return new QuoteNode(node.__key);
  }

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

  static importJSON(serializedNode: SerializedQuoteNode): QuoteNode {
    const node = $createQuoteNode();
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    return node;
  }

  // View

  createDOM(): HTMLElement {
    const element = document.createElement("blockquote");
    addClassNamesToElement(element, levelToClassNameMap["quote"]);
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

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

  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
      type: TYPE
    };
  }

  // Mutation

  insertNewAfter(_: RangeSelection, restoreSelection?: boolean): ParagraphNode {
    const newBlock = $createParagraphNode();
    this.insertAfter(newBlock, restoreSelection);
    return newBlock;
  }

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
