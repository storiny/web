import type {
  $getNodeByKey,
  $isLineBreakNode,
  LineBreakNode,
  NodeKey
} from "lexical";
import { Map as YMap } from "yjs";

import { Binding } from "../bindings";
import { CollabElementNode } from "./CollabElementNode";

export class CollabLineBreakNode {
  constructor(map: YMap<unknown>, parent: CollabElementNode) {
    this._key = "";
    this._map = map;
    this._parent = parent;
    this._type = "linebreak";
  }
  _map: YMap<unknown>;
  _key: NodeKey;
  _parent: CollabElementNode;
  _type: "linebreak";

  getNode(): null | LineBreakNode {
    const node = $getNodeByKey(this._key);
    return $isLineBreakNode(node) ? node : null;
  }

  getKey(): NodeKey {
    return this._key;
  }

  getSharedType(): YMap<unknown> {
    return this._map;
  }

  getType(): string {
    return this._type;
  }

  getSize(): number {
    return 1;
  }

  getOffset(): number {
    const collabElementNode = this._parent;
    return collabElementNode.getChildOffset(this);
  }

  destroy(binding: Binding): void {
    const collabNodeMap = binding.collabNodeMap;
    collabNodeMap.delete(this._key);
  }
}

export const $createCollabLineBreakNode = (
  map: YMap<unknown>,
  parent: CollabElementNode
): CollabLineBreakNode => {
  const collabNode = new CollabLineBreakNode(map, parent);
  // @ts-expect-error: internal field
  map._collabNode = collabNode;
  return collabNode;
};
