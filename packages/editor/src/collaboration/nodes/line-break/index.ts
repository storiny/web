import {
  $getNodeByKey as $get_node_by_key,
  $isLineBreakNode as $is_line_break_node,
  LineBreakNode,
  NodeKey
} from "lexical";
import { Map as YMap } from "yjs";

import { Binding } from "../../bindings";
import { CollabElementNode } from "../element";

const TYPE = "linebreak";

export class CollabLineBreakNode {
  /**
   * Ctor
   * @param map YMap
   * @param parent Parent node
   */
  constructor(map: YMap<unknown>, parent: CollabElementNode) {
    this._key = "";
    this._map = map;
    this._parent = parent;
    this._type = TYPE;
  }

  /**
   * YMap
   */
  public _map: YMap<unknown>;
  /**
   * Node key
   */
  public _key: NodeKey;
  /**
   * Parent node
   */
  public _parent: CollabElementNode;
  /**
   * Type of the node
   */
  private readonly _type: typeof TYPE;

  /**
   * Returns the node
   */
  public get_node(): null | LineBreakNode {
    const node = $get_node_by_key(this._key);
    return $is_line_break_node(node) ? node : null;
  }

  /**
   * Returns the node key
   */
  public get_key(): NodeKey {
    return this._key;
  }

  /**
   * Returns the shared map
   */
  public get_shared_type(): YMap<unknown> {
    return this._map;
  }

  /**
   * Returns the node type
   */
  public get_type(): string {
    return this._type;
  }

  /**
   * Returns the node size
   */
  public get_size(): number {
    return 1;
  }

  /**
   * Returns the node offset
   */
  public get_offset(): number {
    const collab_element_node = this._parent;
    return collab_element_node.get_child_offset(this);
  }

  /**
   * Destroys the node
   * @param binding Binding
   */
  public destroy(binding: Binding): void {
    const collab_node_map = binding.collab_node_map;
    collab_node_map.delete(this._key);
  }
}

/**
 * Creates a new collab line-break node
 * @param map YMap
 * @param parent Parent node
 */
export const $create_collab_line_break_node = (
  map: YMap<unknown>,
  parent: CollabElementNode
): CollabLineBreakNode => {
  const collab_node = new CollabLineBreakNode(map, parent);
  map._collab_node = collab_node;
  return collab_node;
};
