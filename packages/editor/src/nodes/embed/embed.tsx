import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";

import { BlockNode, SerializedBlockNode } from "../block";
import EmbedComponent from "./component";

export type EmbedNodeLayout = "fill" | "overflow";

export interface EmbedPayload {
  key?: NodeKey;
  layout?: EmbedNodeLayout;
  url: string;
}

export type SerializedEmbedNode = Spread<
  {
    layout: EmbedNodeLayout;
    url: string;
  },
  SerializedBlockNode
>;

const TYPE = "embed";
const VERSION = 1;

// noinspection TypeScriptFieldCanBeMadeReadonly
export class EmbedNode extends BlockNode {
  /**
   * Ctor
   * @param url Embed URL
   * @param layout Embed layout
   * @param key Node key
   */
  constructor(
    { url, layout }: Omit<EmbedPayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);
    this.__url = url;
    this.__layout = layout || "fill";
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
  static override clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(
      {
        url: node.__url,
        layout: node.__layout
      },
      node.__key
    );
  }

  /**
   * Imports a serialized node
   * @param serialized_node Serialized node
   */
  static override importJSON(serialized_node: SerializedEmbedNode): EmbedNode {
    return $create_embed_node({
      url: serialized_node.url,
      layout: serialized_node.layout
    });
  }

  /**
   * Embed URL
   * @private
   */
  private readonly __url: string;
  /**
   * Embed layout
   * @private
   */
  private __layout: EmbedNodeLayout;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedEmbedNode {
    return {
      ...super.exportJSON(),
      url: this.__url,
      layout: this.__layout,
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Returns the layout of the node
   */
  public get_layout(): EmbedNodeLayout {
    return this.__layout;
  }

  /**
   * Sets the layout of the node
   * @param layout Layout
   */
  public set_layout(layout: EmbedNodeLayout): void {
    const writable = this.getWritable();
    writable.__layout = layout;
  }

  /**
   * Renders the decorator
   */
  override decorate(): React.ReactElement {
    return (
      <EmbedComponent
        layout={this.__layout}
        node_key={this.getKey()}
        url={this.__url}
      />
    );
  }
}

/**
 * Creates a new embed node
 * @param url Embed URL
 * @param layout Node layout
 */
export const $create_embed_node = ({ url, layout }: EmbedPayload): EmbedNode =>
  new EmbedNode({
    url,
    layout
  });

/**
 * Predicate function for determining embed nodes
 * @param node Node
 */
export const $is_embed_node = (
  node: LexicalNode | null | undefined
): node is EmbedNode => node instanceof EmbedNode;
