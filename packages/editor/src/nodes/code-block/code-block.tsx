import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";
import { Text as YText } from "yjs";

import { BlockNode, SerializedBlockNode } from "../block";
import CodeBlockComponent from "./component";

export interface CodeBlockPayload {
  collab_text?: YText;
  content?: string;
  key?: NodeKey;
  language?: string | null;
}

export type SerializedCodeBlockNode = Spread<
  {
    collab_text: YText;
    language: string | null;
  },
  SerializedBlockNode
>;

const TYPE = "code-block";
const VERSION = 1;

// noinspection TypeScriptFieldCanBeMadeReadonly
export class CodeBlockNode extends BlockNode {
  /**
   * Ctor
   * @param content Code block content
   * @param language Code language
   * @param collab_text Yjs text type
   * @param key Node key
   */
  constructor(
    {
      content,
      language,
      collab_text = new YText()
    }: Omit<CodeBlockPayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);
    this.__collab_text = collab_text;
    this.__language = language || null;

    if (typeof content === "string") {
      this.__collab_text.insert(0, content);
    }
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
  static override clone(node: CodeBlockNode): CodeBlockNode {
    return new CodeBlockNode(
      {
        collab_text: node.__collab_text,
        language: node.__language
      },
      node.__key
    );
  }

  /**
   * Imports a serialized node
   * @param serialized_node Serialized node
   */
  static override importJSON(
    serialized_node: SerializedCodeBlockNode
  ): CodeBlockNode {
    return $create_code_block_node({
      language: serialized_node.language,
      collab_text: serialized_node.collab_text
    });
  }

  /**
   * The language of the code inside the block
   * @private
   */
  private __language: string | null;
  /**
   * Yjs text type holding the code content
   * @private
   */
  public __collab_text: YText;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedCodeBlockNode {
    return {
      ...super.exportJSON(),
      language: this.__language,
      collab_text: this.__collab_text,
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Sets the language of the code inside the node
   * @param next_language Language
   */
  public set_language(next_language: string | null): void {
    const writable = this.getWritable();
    writable.__language = next_language;
  }

  /**
   * Renders the decorator
   */
  override decorate(): React.ReactElement {
    return (
      <CodeBlockComponent
        collab_text={this.__collab_text}
        language={this.__language}
        node_key={this.getKey()}
      />
    );
  }
}

/**
 * Creates a new code block node
 * @param content Code block content
 * @param language Language of the code inside the block
 * @param collab_text Yjs text type
 */
export const $create_code_block_node = ({
  collab_text,
  language,
  content
}: CodeBlockPayload): CodeBlockNode =>
  new CodeBlockNode({ content, language, collab_text });

/**
 * Predicate function for determining code block nodes
 * @param node Node
 */
export const $is_code_block_node = (
  node: LexicalNode | null | undefined
): node is CodeBlockNode => node instanceof CodeBlockNode;
