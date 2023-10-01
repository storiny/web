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
  SerializedElementNode,
  Spread
} from "lexical";

import { TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP } from "~/components/common/typography";
import css from "~/theme/main.module.scss";

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
        conversion: convert_heading_element,
        priority: 0
      }),
      h2: () => ({
        conversion: convert_heading_element,
        priority: 0
      }),
      h3: () => ({
        conversion: convert_heading_element,
        priority: 0
      }),
      h4: () => ({
        conversion: convert_heading_element,
        priority: 0
      }),
      h5: () => ({
        conversion: convert_heading_element,
        priority: 0
      }),
      h6: () => ({
        conversion: convert_heading_element,
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
        const first_child = paragraph.firstChild;

        if (first_child !== null && is_google_docs_title(first_child)) {
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
        if (is_google_docs_title(node)) {
          return {
            conversion: () => ({
              node: $create_heading_node("h2")
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
   * @param serialized_node Serialized node
   */
  static override importJSON(
    serialized_node: SerializedHeadingNode
  ): HeadingNode {
    const node = $create_heading_node(serialized_node.tag);
    node.setFormat(serialized_node.format);
    node.setIndent(serialized_node.indent);
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
  public get_tag(): HeadingTagType {
    return this.__tag;
  }

  /**
   * Creates DOM
   */
  override createDOM(): HTMLElement {
    const tag = this.__tag;
    const element = document.createElement(tag);
    const class_name = TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[tag];

    // For `scrollIntoView` (table of contents)
    element.style.scrollMargin = "calc(var(--header-height) + 18px)";

    if (class_name) {
      add_class_names_to_element(
        element,
        ...[css["t-major"], class_name, styles[tag]]
      );
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
  override exportJSON(): SerializedHeadingNode {
    return {
      ...super.exportJSON(),
      tag: this.get_tag(),
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Inserts node after the new element
   * @param selection Selection
   * @param restore_selection Whether to restore the selection
   */
  override insertNewAfter(
    selection?: RangeSelection,
    restore_selection = true
  ): ParagraphNode | HeadingNode {
    const anchor_offset = selection ? selection.anchor.offset : 0;
    const next_element =
      anchor_offset > 0 && anchor_offset < this.getTextContentSize()
        ? $create_heading_node(this.get_tag())
        : $create_paragraph_node();

    this.insertAfter(next_element, restore_selection);
    return next_element;
  }

  /**
   * Whether to collapse at the start
   */
  override collapseAtStart(): true {
    const next_element = !this.isEmpty()
      ? $create_heading_node(this.get_tag())
      : $create_paragraph_node();
    const children = this.getChildren();
    children.forEach((child) => next_element.append(child));
    this.replace(next_element);
    return true;
  }

  /**
   * Whether the node can be extracted with child
   */
  override extractWithChild(): boolean {
    return true;
  }
}

/**
 * Predicate function for determining title text pasted from Google Docs
 * @param dom_node Node
 */
const is_google_docs_title = (dom_node: Node): boolean => {
  if (dom_node.nodeName.toLowerCase() === "span") {
    return (dom_node as HTMLSpanElement).style.fontSize === "26pt";
  }

  return false;
};

/**
 * Converts a heading element to its equivalent heading node
 * @param element Element
 */
const convert_heading_element = (element: HTMLElement): DOMConversionOutput => {
  const nodeName = element.nodeName.toLowerCase();
  let node: HeadingNode | null = null;

  if (["h1", "h2"].includes(nodeName)) {
    // Convert H1 to H2 (heading)
    node = $create_heading_node("h2");
  } else if (["h3", "h4", "h5", "h6"].includes(nodeName)) {
    // Convert the rest of the headings to H3 (subheadings)
    node = $create_heading_node("h3");
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
 * @param heading_tag Heading level tag
 */
export const $create_heading_node = (
  heading_tag: HeadingTagType
): HeadingNode => $apply_node_replacement(new HeadingNode(heading_tag));

/**
 * Predicate function for determining heading nodes
 * @param node Node
 */
export const $is_heading_node = (
  node: LexicalNode | null | undefined
): node is HeadingNode => node instanceof HeadingNode;
