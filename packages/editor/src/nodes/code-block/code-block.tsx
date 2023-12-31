import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";
import { Text as YText } from "yjs";

import { BlockNode, SerializedBlockNode } from "../block";
import CodeBlockComponent from "./component";

export interface CodeBlockPayload {
  content?: YText;
  key?: NodeKey;
  language?: string | null;
}

export type SerializedCodeBlockNode = Spread<
  {
    content: YText;
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
   * @param language Code language
   * @param content Yjs text type holding the code block content
   * @param key Node key
   */
  constructor(
    {
      language,
      content = new YText()
    }: Omit<CodeBlockPayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);

    this.__content = content;
    this.__language = language || null;
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
        content: node.__content,
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
      content: serialized_node.content
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
  public __content: YText;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedCodeBlockNode {
    return {
      ...super.exportJSON(),
      language: this.__language,
      content: this.__content,
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
        content={this.__content}
        language={this.__language}
        node_key={this.getKey()}
      />
    );
  }
}

/**
 * Creates a new code block node
 * @param language Language of the code inside the block
 * @param content Yjs text type holding the code block content
 */
export const $create_code_block_node = ({
  language,
  content
}: CodeBlockPayload): CodeBlockNode => new CodeBlockNode({ content, language });

/**
 * Predicate function for determining code block nodes
 * @param node Node
 */
export const $is_code_block_node = (
  node: LexicalNode | null | undefined
): node is CodeBlockNode => node instanceof CodeBlockNode;
