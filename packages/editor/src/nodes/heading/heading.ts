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
  SerializedElementNode,
  Spread
} from "lexical";

import { TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP } from "~/components/common/typography";

import styles from "./heading.module.scss";

export type SerializedHeadingNode = Spread<
  {
    tag:
      | "h2" // Heading
      | "h3"; // Subheading
  },
  SerializedElementNode
>;

export type HeadingTagType = "h2" | "h3";

const TYPE = "heading";
const VERSION = 1;

export class HeadingNode extends ElementNode {
  /**
   * Ctor
   * @param tag Heading tag
   * @param key Node key
   */
  constructor(tag: HeadingTagType, key?: NodeKey) {
    super(key);
    this.__tag = tag;
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
  static override clone(node: HeadingNode): HeadingNode {
    return new HeadingNode(node.__tag, node.__key);
  }

  /**
   * Imports node from DOM elements
   */
  static importDOM(): DOMConversionMap | null {
    return {
      h1: () => ({
        conversion: convertHeadingElement,
        priority: 0
      }),
      h2: () => ({
        conversion: convertHeadingElement,
        priority: 0
      }),
      h3: () => ({
        conversion: convertHeadingElement,
        priority: 0
      }),
      h4: () => ({
        conversion: convertHeadingElement,
        priority: 0
      }),
      h5: () => ({
        conversion: convertHeadingElement,
        priority: 0
      }),
      h6: () => ({
        conversion: convertHeadingElement,
        priority: 0
      }),
      p: (
        node: Node
      ): null | {
        conversion: (element: HTMLElement) => DOMConversionOutput | null;
        priority: 3;
      } => {
        // `domNode` is a <p> since we matched it by nodeName
        const paragraph = node as HTMLParagraphElement;
        const firstChild = paragraph.firstChild;

        if (firstChild !== null && isGoogleDocsTitle(firstChild)) {
          return {
            conversion: () => ({ node: null }),
            priority: 3
          };
        }

        return null;
      },
      span: (
        node: Node
      ): null | {
        conversion: (element: HTMLElement) => DOMConversionOutput | null;
        priority: 3;
      } => {
        if (isGoogleDocsTitle(node)) {
          return {
            conversion: () => ({
              node: $createHeadingNode("h2")
            }),
            priority: 3
          };
        }

        return null;
      }
    };
  }

  /**
   * Imports a serialized node
   * @param serializedNode Serialized node
   */
  static override importJSON(
    serializedNode: SerializedHeadingNode
  ): HeadingNode {
    const node = $createHeadingNode(serializedNode.tag);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    return node;
  }

  /**
   * Heading tag nodename
   * @private
   */
  private readonly __tag: HeadingTagType;

  /**
   * Returns the tag type
   */
  public getTag(): HeadingTagType {
    return this.__tag;
  }

  /**
   * Creates DOM
   */
  override createDOM(): HTMLElement {
    const tag = this.__tag;
    const element = document.createElement(tag);
    const className = TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[tag];

    if (className) {
      addClassNamesToElement(element, ...["t-major", className, styles[tag]]);
    }

    return element;
  }

  /**
   * Skip updating the DOM
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
  override exportJSON(): SerializedHeadingNode {
    return {
      ...super.exportJSON(),
      tag: this.getTag(),
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Inserts node after the new element
   * @param selection Selection
   * @param restoreSelection Whether to restore the selection
   */
  override insertNewAfter(
    selection?: RangeSelection,
    restoreSelection = true
  ): ParagraphNode | HeadingNode {
    const anchorOffet = selection ? selection.anchor.offset : 0;
    const newElement =
      anchorOffet > 0 && anchorOffet < this.getTextContentSize()
        ? $createHeadingNode(this.getTag())
        : $createParagraphNode();

    this.insertAfter(newElement, restoreSelection);
    return newElement;
  }

  /**
   * Whether to collapse at the start
   */
  override collapseAtStart(): true {
    const newElement = !this.isEmpty()
      ? $createHeadingNode(this.getTag())
      : $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => newElement.append(child));
    this.replace(newElement);
    return true;
  }

  /**
   * Extracts the node with child
   */
  override extractWithChild(): boolean {
    return true;
  }
}

/**
 * Predicate function for determining title text pasted from Google Docs
 * @param domNode Node
 */
const isGoogleDocsTitle = (domNode: Node): boolean => {
  if (domNode.nodeName.toLowerCase() === "span") {
    return (domNode as HTMLSpanElement).style.fontSize === "26pt";
  }

  return false;
};

/**
 * Converts a heading element to its equivalent heading node
 * @param element Element
 */
const convertHeadingElement = (element: HTMLElement): DOMConversionOutput => {
  const nodeName = element.nodeName.toLowerCase();
  let node: HeadingNode | null = null;

  if (["h1", "h2"].includes(nodeName)) {
    // Convert H1 to H2 (heading)
    node = $createHeadingNode("h2");
  } else if (["h3", "h4", "h5", "h6"].includes(nodeName)) {
    // Convert the rest of the headings to H3 (subheadings)
    node = $createHeadingNode("h3");
  }

  if (node !== null) {
    if (element.style !== null) {
      node.setFormat(element.style.textAlign as ElementFormatType);
    }
  }

  return { node };
};

/**
 * Creates a new heading node
 * @param headingTag Heading level tag
 */
export const $createHeadingNode = (headingTag: HeadingTagType): HeadingNode =>
  $applyNodeReplacement(new HeadingNode(headingTag));

/**
 * Predicate function for determining heading nodes
 * @param node Node
 */
export const $isHeadingNode = (
  node: LexicalNode | null | undefined
): node is HeadingNode => node instanceof HeadingNode;
