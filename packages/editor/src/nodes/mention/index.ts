import {
  $applyNodeReplacement as $apply_node_replacement,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode
} from "lexical";

import styles from "~/components/typography/typography.module.scss";

export type SerializedMentionNode = Spread<
  {
    username: string;
  },
  SerializedTextNode
>;

/**
 * Converts a DOM node to a mention node using the inner text content.
 * @param dom_node The DOM node.
 */
const convert_mention_element = (
  dom_node: Element
): DOMConversionOutput | null => {
  const text_content = dom_node.textContent;

  if (text_content !== null) {
    const node = $create_mention_node(text_content);
    return { node };
  }

  return null;
};

/**
 * Removes the `@` from the start of the username
 * @param username The username
 */
const normalize_username = (username = ""): string =>
  username.replace(/@/g, "");

const TYPE = "mention";
const VERSION = 1;

export class MentionNode extends TextNode {
  /**
   * Ctor
   * @param username The username of the user being mentioned
   * @param key Node key
   */
  constructor(username: string, key?: NodeKey) {
    username = normalize_username(username);

    super(`@${username}`, key);
    this.__username = username;
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
  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__username, node.__key);
  }

  /**
   * Imports node from JSON data
   * @param serialized_node Serialized node
   */
  static importJSON(serialized_node: SerializedMentionNode): MentionNode {
    const node = $create_mention_node(
      normalize_username(serialized_node.username)
    );
    node.setTextContent(`@${normalize_username(serialized_node.text)}`);
    node.setFormat(serialized_node.format);
    node.setDetail(serialized_node.detail);
    node.setMode(serialized_node.mode);

    return node;
  }

  /**
   * Imports node from DOM element
   */
  static importDOM(): DOMConversionMap | null {
    return {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      span: (dom_node) => {
        if (!dom_node.hasAttribute("data-mention")) {
          return null;
        }

        return {
          conversion: convert_mention_element,
          priority: 1
        };
      }
    };
  }

  /**
   * The username of the mentioned user.
   */
  private readonly __username: string;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      username: normalize_username(this.__username),
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Creates the DOM node for the mention
   */
  override createDOM(): HTMLElement {
    const dom = document.createElement("a");
    dom.setAttribute("data-mention", "true");
    dom.textContent = `@${this.__username}`;
    dom.href = `/${this.__username}`;
    dom.className = styles.mention;
    dom.style.fontSize = "calc(0.9em)";

    return dom;
  }

  /**
   * Exports node to element
   */
  override exportDOM(): DOMExportOutput {
    const element = document.createElement("a");
    element.setAttribute("data-mention", "true");
    element.textContent = `@${this.__username}`;
    element.href = `/${this.__username}`;

    return { element };
  }

  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  override isTextEntity(): true {
    return true;
  }

  /**
   * Disables inserting text before the node
   */
  override canInsertTextBefore(): boolean {
    return false;
  }

  /**
   * Disables inserting text after the node
   */
  override canInsertTextAfter(): boolean {
    return false;
  }
}

/**
 * Predicate function for determining mention nodes
 * @param node The lexical node
 */
export const $is_mention_node = (
  node: LexicalNode | null | undefined
): node is MentionNode => node instanceof MentionNode;

/**
 * Creates a new mention node
 * @param username The username of the mentioned user.
 */
export const $create_mention_node = (username: string): MentionNode => {
  const mention_node = new MentionNode(username);
  mention_node.setMode("segmented").toggleDirectionless();
  return $apply_node_replacement(mention_node);
};
