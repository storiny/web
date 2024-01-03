import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";
import { Text as YText } from "yjs";

import { BlockNode, SerializedBlockNode } from "../block";
import CodeBlockComponent from "./component";

export interface CodeBlockPayload {
  content?: YText;
  key?: NodeKey;
  language?: string | null;
  title?: string;
}

export type SerializedCodeBlockNode = Spread<
  {
    content: YText;
    language: string | null;
    title: string;
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
   * @param title Title of the code block
   * @param key Node key
   */
  constructor(
    {
      title,
      language,
      content = new YText()
    }: Omit<CodeBlockPayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);

    this.__title = title || "";
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
        language: node.__language,
        title: node.__title
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
      content: serialized_node.content,
      title: serialized_node.title
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
   * The title of the code block
   * @private
   */
  private __title: string;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedCodeBlockNode {
    return {
      ...super.exportJSON(),
      language: this.__language,
      content: this.__content,
      title: this.__title,
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
   * Sets the title of the code block
   * @param next_title Title
   */
  public set_title(next_title: string): void {
    const writable = this.getWritable();
    writable.__title = next_title;
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
        title={this.__title}
      />
    );
  }
}

/**
 * Creates a new code block node
 * @param language Language of the code inside the block
 * @param content Yjs text type holding the code block content
 * @param title Title of the code block
 */
export const $create_code_block_node = ({
  language,
  content,
  title
}: CodeBlockPayload): CodeBlockNode =>
  new CodeBlockNode({ content, language, title });

/**
 * Predicate function for determining code block nodes
 * @param node Node
 */
export const $is_code_block_node = (
  node: LexicalNode | null | undefined
): node is CodeBlockNode => node instanceof CodeBlockNode;
