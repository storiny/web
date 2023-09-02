import {
  $getNodeByKey,
  $isLineBreakNode,
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
  _map: YMap<unknown>;
  /**
   * Node key
   */
  _key: NodeKey;
  /**
   * Parent node
   */
  _parent: CollabElementNode;
  /**
   * Type of the node
   */
  _type: typeof TYPE;

  /**
   * Returns the node
   */
  getNode(): null | LineBreakNode {
    const node = $getNodeByKey(this._key);
    return $isLineBreakNode(node) ? node : null;
  }

  /**
   * Returns the node key
   */
  getKey(): NodeKey {
    return this._key;
  }

  /**
   * Returns the shared map
   */
  getSharedType(): YMap<unknown> {
    return this._map;
  }

  /**
   * Returns the node type
   */
  getType(): string {
    return this._type;
  }

  /**
   * Returns the node size
   */
  getSize(): number {
    return 1;
  }

  /**
   * Returns the node offset
   */
  getOffset(): number {
    const collabElementNode = this._parent;
    return collabElementNode.getChildOffset(this);
  }

  /**
   * Destroys the node
   * @param binding Binding
   */
  destroy(binding: Binding): void {
    const collabNodeMap = binding.collabNodeMap;
    collabNodeMap.delete(this._key);
  }
}

/**
 * Creates a new collab line-break node
 * @param map YMap
 * @param parent Parent node
 */
export const $createCollabLineBreakNode = (
  map: YMap<unknown>,
  parent: CollabElementNode
): CollabLineBreakNode => {
  const collabNode = new CollabLineBreakNode(map, parent);
  // @ts-expect-error: internal field
  map._collabNode = collabNode;
  return collabNode;
};
