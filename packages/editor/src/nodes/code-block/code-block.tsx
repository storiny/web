import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";

import { BlockNode, SerializedBlockNode } from "../block";
import CodeBlockComponent from "./component";

export interface CodeBlockPayload {
  content?: string;
  key?: NodeKey;
  language?: string | null;
  line_count?: number;
}

export type SerializedCodeBlockNode = Spread<
  {
    content: string;
    language: string | null;
    line_count: number;
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
   * @param line_count Number of lines inside the code block
   * @param key Node key
   */
  constructor(
    {
      content,
      language,
      line_count
    }: Omit<CodeBlockPayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);
    this.__content = content || "";
    this.__language = language || null;
    this.__line_count = line_count || 1;
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
        language: node.__language,
        line_count: node.__line_count
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
      content: serialized_node.content,
      language: serialized_node.language,
      line_count: serialized_node.line_count
    });
  }

  /**
   * Code block content
   * @private
   */
  private __content: string;
  /**
   * The number of lines in the code block, used to compute the estimated height during lazy loading.
   * @private
   */
  private __line_count: number;
  /**
   * The language of the code inside the block
   * @private
   */
  private __language: string | null;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedCodeBlockNode {
    return {
      ...super.exportJSON(),
      content: this.__content,
      language: this.__language,
      line_count: this.__line_count,
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Sets the content of the node
   * @param next_content Content
   */
  public set_content(next_content: string): void {
    const writable = this.getWritable();
    writable.__content = next_content;
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
   * Sets the line count of the node
   * @param next_line_count Line count
   */
  public set_line_count(next_line_count: number): void {
    const writable = this.getWritable();
    writable.__line_count = next_line_count;
  }

  /**
   * Renders the decorator
   */
  override decorate(): React.ReactElement {
    return (
      <CodeBlockComponent
        content={this.__content}
        language={this.__language}
        line_count={this.__line_count}
        node_key={this.getKey()}
      />
    );
  }
}

/**
 * Creates a new code block node
 * @param content Code block content
 * @param language Language of the code inside the block
 * @param line_count Number of lines inside the code block
 */
export const $create_code_block_node = ({
  line_count,
  language,
  content
}: CodeBlockPayload): CodeBlockNode =>
  new CodeBlockNode({ content, language, line_count });

/**
 * Predicate function for determining code block nodes
 * @param node Node
 */
export const $is_code_block_node = (
  node: LexicalNode | null | undefined
): node is CodeBlockNode => node instanceof CodeBlockNode;
