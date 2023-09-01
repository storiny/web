import {
  $getNodeByKey,
  $isDecoratorNode,
  DecoratorNode,
  NodeKey,
  NodeMap
} from "lexical";
import { XmlElement } from "yjs";

import { Binding } from "../bindings";
import { CollabElementNode } from "../collab-element-node";
import { syncPropertiesFromLexical, syncPropertiesFromYjs } from "../utils";

export class CollabDecoratorNode {
  constructor(xmlElem: XmlElement, parent: CollabElementNode, type: string) {
    this._key = "";
    this._xmlElem = xmlElem;
    this._parent = parent;
    this._type = type;
    this._unobservers = new Set();
  }
  _xmlElem: XmlElement;
  _key: NodeKey;
  _parent: CollabElementNode;
  _type: string;
  _unobservers: Set<() => void>;

  getPrevNode(nodeMap: null | NodeMap): null | DecoratorNode<unknown> {
    if (nodeMap === null) {
      return null;
    }

    const node = nodeMap.get(this._key);
    return $isDecoratorNode(node) ? node : null;
  }

  getNode(): null | DecoratorNode<unknown> {
    const node = $getNodeByKey(this._key);
    return $isDecoratorNode(node) ? node : null;
  }

  getSharedType(): XmlElement {
    return this._xmlElem;
  }

  getType(): string {
    return this._type;
  }

  getKey(): NodeKey {
    return this._key;
  }

  getSize(): number {
    return 1;
  }

  getOffset(): number {
    const collabElementNode = this._parent;
    return collabElementNode.getChildOffset(this);
  }

  syncPropertiesFromLexical(
    binding: Binding,
    nextLexicalNode: DecoratorNode<unknown>,
    prevNodeMap: null | NodeMap
  ): void {
    const prevLexicalNode = this.getPrevNode(prevNodeMap);
    const xmlElem = this._xmlElem;

    syncPropertiesFromLexical(
      binding,
      xmlElem,
      prevLexicalNode,
      nextLexicalNode
    );
  }

  syncPropertiesFromYjs(
    binding: Binding,
    keysChanged: null | Set<string>
  ): void {
    const lexicalNode = this.getNode();

    if (lexicalNode) {
      const xmlElem = this._xmlElem;
      syncPropertiesFromYjs(binding, xmlElem, lexicalNode, keysChanged);
    }
  }

  destroy(binding: Binding): void {
    const collabNodeMap = binding.collabNodeMap;
    collabNodeMap.delete(this._key);
    this._unobservers.forEach((unobserver) => unobserver());
    this._unobservers.clear();
  }
}

export const $createCollabDecoratorNode = (
  xmlElem: XmlElement,
  parent: CollabElementNode,
  type: string
): CollabDecoratorNode => {
  const collabNode = new CollabDecoratorNode(xmlElem, parent, type);
  // @ts-expect-error: internal field
  xmlElem._collabNode = collabNode;
  return collabNode;
};
