import { $getNodeByKey as $get_node_by_key, NodeKey, NodeMap } from "lexical";
import { Map as YMap } from "yjs";

import { $is_code_block_node, CodeBlockNode } from "../../../nodes/code-block";
import { sync_properties_from_lexical } from "../../../utils/sync-properties-from-lexical";
import { sync_properties_from_yjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabElementNode } from "../element";

export class CollabCodeBlockNode {
  /**
   * Ctor
   * @param map Yjs map element
   * @param parent Parent node
   */
  constructor(map: YMap<unknown>, parent: CollabElementNode) {
    this._key = "";
    this._map = map;
    this._parent = parent;
  }

  /**
   * Map element
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
   * Returns the previous node
   * @param node_map Node map
   */
  public get_prev_node(node_map: null | NodeMap): null | CodeBlockNode {
    if (node_map === null) {
      return null;
    }

    const node = node_map.get(this._key);
    return $is_code_block_node(node) ? node : null;
  }

  /**
   * Returns the node
   */
  public get_node(): null | CodeBlockNode {
    const node = $get_node_by_key(this._key);
    return $is_code_block_node(node) ? node : null;
  }

  /**
   * Returns the shared type
   */
  public get_shared_type(): YMap<unknown> {
    return this._map;
  }

  /**
   * Returns the node type
   */
  public get_type(): string {
    return "code-block";
  }

  /**
   * Returns the node key
   */
  public get_key(): NodeKey {
    return this._key;
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
   * Syncs properties from the editor
   * @param binding Binding
   * @param next_lexical_node Next node
   * @param prev_node_map Previous node map
   */
  public sync_properties_from_lexical(
    binding: Binding,
    next_lexical_node: CodeBlockNode,
    prev_node_map: null | NodeMap
  ): void {
    const prev_lexical_node = this.get_prev_node(prev_node_map);
    const map = this._map;

    sync_properties_from_lexical(
      binding,
      map,
      prev_lexical_node,
      next_lexical_node
    );
  }

  /**
   * Syncs properties from yjs
   * @param binding Binding
   * @param keys_changed Set of changed keys
   */
  public sync_properties_from_yjs(
    binding: Binding,
    keys_changed: null | Set<string>
  ): void {
    const lexical_node = this.get_node();
    const map = this._map;

    if (lexical_node === null) {
      throw new Error(
        "`sync_properties_from_yjs`: could not find the code block node"
      );
    }

    sync_properties_from_yjs(binding, map, lexical_node, keys_changed);
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
 * Creates a new collab code block node
 * @param map Yjs map element
 * @param parent Parent node
 */
export const $create_collab_code_block_node = (
  map: YMap<unknown>,
  parent: CollabElementNode
): CollabCodeBlockNode => {
  map.set("__type", "code-block");
  const node = new CollabCodeBlockNode(map, parent);
  map._collab_node = node;
  return node;
};
