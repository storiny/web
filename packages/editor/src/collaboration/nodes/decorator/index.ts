import {
  $getNodeByKey,
  $isDecoratorNode,
  DecoratorNode,
  NodeKey,
  NodeMap
} from "lexical";
import { XmlElement } from "yjs";

import { syncPropertiesFromLexical } from "../../../utils/sync-properties-from-lexical";
import { syncPropertiesFromYjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabElementNode } from "../element";

export class CollabDecoratorNode {
  /**
   * Ctor
   * @param xmlElement XML element
   * @param parent Parent node
   * @param type Node type
   */
  constructor(xmlElement: XmlElement, parent: CollabElementNode, type: string) {
    this._key = "";
    this._xmlElem = xmlElement;
    this._parent = parent;
    this._type = type;
    this._unobservers = new Set();
  }

  /**
   * XML element
   */
  _xmlElem: XmlElement;
  /**
   * Node key
   */
  _key: NodeKey;
  /**
   * Parent node
   */
  _parent: CollabElementNode;
  /**
   * Node type
   */
  _type: string;
  /**
   * Set of unobservers
   */
  _unobservers: Set<() => void>;

  /**
   * Returns the previous node
   * @param nodeMap Node map
   */
  getPrevNode(nodeMap: null | NodeMap): null | DecoratorNode<unknown> {
    if (nodeMap === null) {
      return null;
    }

    const node = nodeMap.get(this._key);
    return $isDecoratorNode(node) ? node : null;
  }

  /**
   * Returns the node
   */
  getNode(): null | DecoratorNode<unknown> {
    const node = $getNodeByKey(this._key);
    return $isDecoratorNode(node) ? node : null;
  }

  /**
   * Returns the shared type
   */
  getSharedType(): XmlElement {
    return this._xmlElem;
  }

  /**
   * Returns the node type
   */
  getType(): string {
    return this._type;
  }

  /**
   * Returns the node key
   */
  getKey(): NodeKey {
    return this._key;
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
   * Syncs properties from the editor
   * @param binding Binding
   * @param nextLexicalNode Next node
   * @param prevNodeMap Previous node map
   */
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

  /**
   * Syncs properties from yjs
   * @param binding Binding
   * @param keysChanged Set of changed keys
   */
  syncPropertiesFromYjs(
    binding: Binding,
    keysChanged: null | Set<string>
  ): void {
    const lexicalNode = this.getNode();

    if (lexicalNode === null) {
      throw new Error(
        "`syncPropertiesFromYjs`: could not find the decorator node"
      );
    }

    const xmlElem = this._xmlElem;
    syncPropertiesFromYjs(binding, xmlElem, lexicalNode, keysChanged);
  }

  /**
   * Destroys the node
   * @param binding Binding
   */
  destroy(binding: Binding): void {
    const collabNodeMap = binding.collabNodeMap;
    collabNodeMap.delete(this._key);

    this._unobservers.forEach((unobserver) => unobserver());
    this._unobservers.clear();
  }
}

/**
 * Creates a new collab decorator node
 * @param xmlElement XML element
 * @param parent Parent node
 * @param type Node type
 */
export const $createCollabDecoratorNode = (
  xmlElement: XmlElement,
  parent: CollabElementNode,
  type: string
): CollabDecoratorNode => {
  const collabNode = new CollabDecoratorNode(xmlElement, parent, type);
  // @ts-expect-error: internal field
  xmlElement._collabNode = collabNode;
  return collabNode;
};
