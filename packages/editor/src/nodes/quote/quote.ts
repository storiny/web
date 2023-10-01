import {
  addClassNamesToElement as add_class_names_to_element,
  isHTMLElement as is_html_element
} from "@lexical/utils";
import {
  $applyNodeReplacement as $apply_node_replacement,
  $createParagraphNode as $create_paragraph_node,
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

import { TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP } from "~/components/common/typography";

import styles from "./quote.module.scss";

export type SerializedQuoteNode = SerializedElementNode;

const TYPE = "quote";
const VERSION = 1;

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
  static override getType(): string {
    return TYPE;
  }

  /**
   * Clones the node
   * @param node Node
   */
  static override clone(node: QuoteNode): QuoteNode {
    return new QuoteNode(node.__key);
  }

  /**
   * Imports node from DOM element
   */
  static importDOM(): DOMConversionMap | null {
    return {
      blockquote: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          const node = $create_quote_node();

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
   * @param serialized_node Serialized node
   */
  static override importJSON(serialized_node: SerializedQuoteNode): QuoteNode {
    const node = $create_quote_node();
    node.setFormat(serialized_node.format);
    node.setIndent(serialized_node.indent);
    return node;
  }

  /**
   * Creates DOM
   */
  override createDOM(): HTMLElement {
    const element = document.createElement("blockquote");
    add_class_names_to_element(
      element,
      ...[TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP.quote, styles.quote]
    );

    return element;
  }

  /**
   * Skips updating the DOM
   */
  override updateDOM(): boolean {
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

      element.style.textAlign = this.getFormatType();
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
   * Inserts node after the new element
   * @param _ Selection
   * @param restore_selection Whether to restore the selection
   */
  override insertNewAfter(
    _: RangeSelection,
    restore_selection?: boolean
  ): ParagraphNode {
    const next_node = $create_paragraph_node();
    this.insertAfter(next_node, restore_selection);
    return next_node;
  }

  /**
   * Wraps the content in a paragraph node when the backspace key is pressed
   * and the selection is at the start of the quote node
   */
  override collapseAtStart(): true {
    const paragraph = $create_paragraph_node();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }
}

/**
 * Creates a new quote node
 */
export const $create_quote_node = (): QuoteNode =>
  $apply_node_replacement(new QuoteNode());

/**
 * Predicate function for determining quote nodes
 * @param node Node
 */
export const $is_quote_node = (
  node: LexicalNode | null | undefined
): node is QuoteNode => node instanceof QuoteNode;
