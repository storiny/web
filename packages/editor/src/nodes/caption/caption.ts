import { is_html_element as is_html_element } from "@lexical/utils";
import {
  $applyNodeReplacement as $apply_node_replacement,
  $createParagraphNode as $create_paragraph_node,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode
} from "lexical";

import styles from "./caption.module.scss";

export type SerializedCaptionNode = SerializedElementNode;

const TYPE = "caption";
const VERSION = 1;

export class CaptionNode extends ElementNode {
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
  static override clone(node: CaptionNode): CaptionNode {
    return new CaptionNode(node.__key);
  }

  /**
   * Imports a serialized node
   * @param serialized_node Serialized node
   */
  static override importJSON(
    serialized_node: SerializedCaptionNode
  ): CaptionNode {
    return $create_caption_node().setFormat(serialized_node.format);
  }

  /**
   * Creates DOM
   * @param _ Editor config
   * @param editor Editor
   */
  override createDOM(_: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("figcaption");
    dom.classList.add(styles.caption);

    if (editor.isEditable()) {
      // Show placeholder if empty
      dom.setAttribute("data-empty", String(this.isEmpty()));
    }

    return dom;
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
   * Disables alignment formats
   * @param type Format type
   */
  override setFormat(type: ElementFormatType): this {
    return (
      [
        "start",
        "left",
        "center",
        "right",
        "end",
        "justify"
      ] as ElementFormatType[]
    ).includes(type)
      ? this
      : super.setFormat(type);
  }

  /**
   * Prevents indenting the node
   */
  override canIndent(): false {
    return false;
  }

  /**
   * Prevents the node from getting removed when there are no children
   */
  override canBeEmpty(): true {
    return true;
  }

  /**
   * Marks the node as block node
   */
  override isInline(): false {
    return false;
  }

  /**
   * Inserts new paragraph node after the node
   * @param _ Range selection
   * @param restore_selection Whether to try to restore the selection
   */
  override insertNewAfter(
    _: RangeSelection,
    restore_selection: boolean
  ): ParagraphNode {
    const next_element = $create_paragraph_node();
    this.insertAfter(next_element, restore_selection);
    return next_element;
  }
}

/**
 * Creates a new caption node
 */
export const $create_caption_node = (): CaptionNode =>
  $apply_node_replacement(new CaptionNode());

/**
 * Predicate function for determining caption nodes
 * @param node Node
 */
export const $is_caption_node = (
  node: LexicalNode | null | undefined
): node is CaptionNode => node instanceof CaptionNode;
