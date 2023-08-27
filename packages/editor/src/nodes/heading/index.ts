import { addClassNamesToElement, isHTMLElement } from "@lexical/utils";
import {
  $applyNodeReplacement,
  $createParagraphNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
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

import { levelToClassNameMap } from "~/components/common/typography";

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

export class HeadingNode extends ElementNode {
  constructor(tag: HeadingTagType, key?: NodeKey) {
    super(key);
    this.__tag = tag;
  }

  static getType(): string {
    return TYPE;
  }

  static clone(node: HeadingNode): HeadingNode {
    return new HeadingNode(node.__tag, node.__key);
  }

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
        // domNode is a <p> since we matched it by nodeName
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

  static importJSON(serializedNode: SerializedHeadingNode): HeadingNode {
    const node = $createHeadingNode(serializedNode.tag);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    return node;
  }

  /**
   * @internal
   */
  __tag: HeadingTagType;

  getTag(): HeadingTagType {
    return this.__tag;
  }

  // View

  createDOM(): HTMLElement {
    const tag = this.__tag;
    const element = document.createElement(tag);
    const className = levelToClassNameMap[tag];

    if (className) {
      addClassNamesToElement(element, className);
    }

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

  exportJSON(): SerializedHeadingNode {
    return {
      ...super.exportJSON(),
      tag: this.getTag(),
      type: TYPE,
      version: 1
    };
  }

  // Mutation

  insertNewAfter(
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

  collapseAtStart(): true {
    const newElement = !this.isEmpty()
      ? $createHeadingNode(this.getTag())
      : $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => newElement.append(child));
    this.replace(newElement);
    return true;
  }

  extractWithChild(): boolean {
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
