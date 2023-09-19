import {
  $getNodeByKey,
  $isDecoratorNode,
  $isElementNode,
  $isTextNode,
  ElementNode,
  NodeKey,
  NodeMap
} from "lexical";
import { AbstractType, XmlElement, XmlText } from "yjs";
import { YMap } from "yjs/dist/src/internals";

import { createChildrenArray } from "../../../utils/create-children-array";
import { $createCollabNodeFromLexicalNode } from "../../../utils/create-collab-node-from-lexical-node";
import { createLexicalNodeFromCollabNode } from "../../../utils/create-lexical-node-from-collab-node";
import { $getNodeByKeyOrThrow } from "../../../utils/get-node-by-key-or-throw";
import { getOrInitCollabNodeFromSharedType } from "../../../utils/get-or-init-collab-node-from-shared-type";
import { getPositionFromElementAndOffset } from "../../../utils/get-position-from-element-and-offset";
import { removeFromParent } from "../../../utils/remove-from-parent";
import { spliceString } from "../../../utils/splice-string";
import { syncPropertiesFromLexical } from "../../../utils/sync-properties-from-lexical";
import { syncPropertiesFromYjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabDecoratorNode } from "../decorator";
import { CollabLineBreakNode } from "../line-break";
import { CollabTextNode } from "../text";

type IntentionallyMarkedAsDirtyElement = boolean;

export class CollabElementNode {
  /**
   * Ctor
   * @param xmlText XML text
   * @param parent Parent node
   * @param type Node type
   */
  constructor(
    xmlText: XmlText,
    parent: null | CollabElementNode,
    type: string
  ) {
    this._key = "";
    this._children = [];
    this._xmlText = xmlText;
    this._type = type;
    this._parent = parent;
  }

  /**
   * Node key
   */
  _key: NodeKey;
  /**
   * Node children
   */
  _children: Array<
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
  >;
  /**
   * XML text
   */
  _xmlText: XmlText;
  /**
   * Node type
   */
  _type: string;
  /**
   * Parent node
   */
  _parent: null | CollabElementNode;

  /**
   * Returns the previous node
   * @param nodeMap Node map
   */
  getPrevNode(nodeMap: null | NodeMap): null | ElementNode {
    if (nodeMap === null) {
      return null;
    }

    const node = nodeMap.get(this._key);
    return $isElementNode(node) ? node : null;
  }

  /**
   * Returns the node
   */
  getNode(): null | ElementNode {
    const node = $getNodeByKey(this._key);
    return $isElementNode(node) ? node : null;
  }

  /**
   * Returns the shared type
   */
  getSharedType(): XmlText {
    return this._xmlText;
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
   * Predicate method for determining whether the node is empty
   */
  isEmpty(): boolean {
    return this._children.length === 0;
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

    if (collabElementNode === null) {
      throw new Error("`getOffset`: could not find the collab element node");
    }

    return collabElementNode.getChildOffset(this);
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
        "`syncPropertiesFromYjs`: could not find the collab element node"
      );
    }

    syncPropertiesFromYjs(binding, this._xmlText, lexicalNode, keysChanged);
  }

  /**
   * Applies children yjs delta
   * @param binding Binding
   * @param deltas Yjs deltas
   */
  applyChildrenYjsDelta(
    binding: Binding,
    deltas: Array<{
      attributes?: {
        [x: string]: unknown;
      };
      delete?: number;
      insert?: string | object | AbstractType<unknown>;
      retain?: number;
    }>
  ): void {
    const children = this._children;
    let currIndex = 0;

    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      const insertDelta = delta.insert;
      const deleteDelta = delta.delete;

      if (delta.retain != null) {
        currIndex += delta.retain;
      } else if (typeof deleteDelta === "number") {
        let deletionSize = deleteDelta;

        while (deletionSize > 0) {
          const { node, nodeIndex, offset, length } =
            getPositionFromElementAndOffset(this, currIndex, false);

          if (
            node instanceof CollabElementNode ||
            node instanceof CollabLineBreakNode ||
            node instanceof CollabDecoratorNode
          ) {
            children.splice(nodeIndex, 1);
            deletionSize -= 1;
          } else if (node instanceof CollabTextNode) {
            const delCount = Math.min(deletionSize, length);
            const prevCollabNode =
              nodeIndex !== 0 ? children[nodeIndex - 1] : null;
            const nodeSize = node.getSize();

            if (
              offset === 0 &&
              delCount === 1 &&
              nodeIndex > 0 &&
              prevCollabNode instanceof CollabTextNode &&
              length === nodeSize &&
              // If the node has no keys, it's been deleted
              Array.from(node._map.keys()).length === 0
            ) {
              // Merge the text node with previous
              prevCollabNode._text += node._text;
              children.splice(nodeIndex, 1);
            } else if (offset === 0 && delCount === nodeSize) {
              // The entire thing needs to be removed
              children.splice(nodeIndex, 1);
            } else {
              node._text = spliceString(node._text, offset, delCount, "");
            }

            deletionSize -= delCount;
          } else {
            // Can occur due to the deletion from the dangling text heuristic below
            break;
          }
        }
      } else if (insertDelta != null) {
        if (typeof insertDelta === "string") {
          const { node, offset } = getPositionFromElementAndOffset(
            this,
            currIndex,
            true
          );

          if (node instanceof CollabTextNode) {
            node._text = spliceString(node._text, offset, 0, insertDelta);
          } else {
            /**
             * TODO: Maybe we can improve this by keeping around a redundant
             *   text node map, rather than removing all the text nodes, so there
             *   never can be dangling text.
             */

            // We have a conflict where there was likely a `CollabTextNode` and
            // a Lexical TextNode too, but they were removed in a merge. So
            // let's just ignore the text and trigger a removal for it from our
            // shared type
            this._xmlText.delete(offset, insertDelta.length);
          }

          currIndex += insertDelta.length;
        } else {
          const sharedType = insertDelta;
          const { nodeIndex } = getPositionFromElementAndOffset(
            this,
            currIndex,
            false
          );
          const collabNode = getOrInitCollabNodeFromSharedType(
            binding,
            sharedType as XmlText | YMap<unknown> | XmlElement,
            this
          );

          children.splice(nodeIndex, 0, collabNode);
          currIndex += 1;
        }
      } else {
        throw new Error("Unexpected delta format");
      }
    }
  }

  /**
   * Syncs children from yjs
   * @param binding Binding
   */
  syncChildrenFromYjs(binding: Binding): void {
    // Diff the children of the collab node with that of our existing Lexical node
    const lexicalNode = this.getNode();

    if (lexicalNode === null) {
      throw new Error("`syncChildrenFromYjs`: could not find the element node");
    }

    const key = lexicalNode.__key;
    const prevLexicalChildrenKeys = createChildrenArray(lexicalNode, null);
    const lexicalChildrenKeysLength = prevLexicalChildrenKeys.length;
    const collabChildren = this._children;
    const collabChildrenLength = collabChildren.length;
    const collabNodeMap = binding.collabNodeMap;
    const visitedKeys = new Set();
    let collabKeys;
    let writableLexicalNode;
    let prevIndex = 0;
    let prevChildNode = null;

    if (collabChildrenLength !== lexicalChildrenKeysLength) {
      writableLexicalNode = lexicalNode.getWritable();
    }

    for (let i = 0; i < collabChildrenLength; i++) {
      const lexicalChildKey = prevLexicalChildrenKeys[prevIndex];
      const childCollabNode = collabChildren[i];
      const collabLexicalChildNode = childCollabNode.getNode();
      const collabKey = childCollabNode._key;

      if (collabLexicalChildNode !== null && lexicalChildKey === collabKey) {
        const childNeedsUpdating = $isTextNode(collabLexicalChildNode);
        // Update
        visitedKeys.add(lexicalChildKey);

        if (childNeedsUpdating) {
          childCollabNode._key = lexicalChildKey;

          if (childCollabNode instanceof CollabElementNode) {
            const xmlText = childCollabNode._xmlText;
            childCollabNode.syncPropertiesFromYjs(binding, null);
            childCollabNode.applyChildrenYjsDelta(binding, xmlText.toDelta());
            childCollabNode.syncChildrenFromYjs(binding);
          } else if (childCollabNode instanceof CollabTextNode) {
            childCollabNode.syncPropertiesAndTextFromYjs(binding, null);
          } else if (childCollabNode instanceof CollabDecoratorNode) {
            childCollabNode.syncPropertiesFromYjs(binding, null);
          } else if (
            !((childCollabNode as unknown) instanceof CollabLineBreakNode)
          ) {
            throw new Error("`syncChildrenFromYjs`: unknown collab node");
          }
        }

        prevChildNode = collabLexicalChildNode;
        prevIndex++;
      } else {
        if (collabKeys === undefined) {
          collabKeys = new Set();

          for (let s = 0; s < collabChildrenLength; s++) {
            const child = collabChildren[s];
            const childKey = child._key;

            if (childKey !== "") {
              collabKeys.add(childKey);
            }
          }
        }

        if (
          collabLexicalChildNode !== null &&
          lexicalChildKey !== undefined &&
          !collabKeys.has(lexicalChildKey)
        ) {
          const nodeToRemove = $getNodeByKeyOrThrow(lexicalChildKey);
          removeFromParent(nodeToRemove);
          i--;
          prevIndex++;
          continue;
        }

        writableLexicalNode = lexicalNode.getWritable();

        // Create/Replace
        const lexicalChildNode = createLexicalNodeFromCollabNode(
          binding,
          childCollabNode,
          key
        );
        const childKey = lexicalChildNode.__key;

        collabNodeMap.set(childKey, childCollabNode);

        if (prevChildNode === null) {
          const nextSibling = writableLexicalNode.getFirstChild();
          writableLexicalNode.__first = childKey;

          if (nextSibling !== null) {
            const writableNextSibling = nextSibling.getWritable();
            writableNextSibling.__prev = childKey;
            lexicalChildNode.__next = writableNextSibling.__key;
          }
        } else {
          const writablePrevChildNode = prevChildNode.getWritable();
          const nextSibling = prevChildNode.getNextSibling();

          writablePrevChildNode.__next = childKey;
          lexicalChildNode.__prev = prevChildNode.__key;

          if (nextSibling !== null) {
            const writableNextSibling = nextSibling.getWritable();
            writableNextSibling.__prev = childKey;
            lexicalChildNode.__next = writableNextSibling.__key;
          }
        }

        if (i === collabChildrenLength - 1) {
          writableLexicalNode.__last = childKey;
        }

        writableLexicalNode.__size++;
        prevChildNode = lexicalChildNode;
      }
    }

    for (let i = 0; i < lexicalChildrenKeysLength; i++) {
      const lexicalChildKey = prevLexicalChildrenKeys[i];

      if (!visitedKeys.has(lexicalChildKey)) {
        // Remove
        const lexicalChildNode = $getNodeByKeyOrThrow(lexicalChildKey);
        const collabNode = binding.collabNodeMap.get(lexicalChildKey);

        if (collabNode !== undefined) {
          collabNode.destroy(binding);
        }

        removeFromParent(lexicalChildNode);
      }
    }
  }

  /**
   * Syncs properties from the editor
   * @param binding Binding
   * @param nextLexicalNode Next node
   * @param prevNodeMap Previous node map
   */
  syncPropertiesFromLexical(
    binding: Binding,
    nextLexicalNode: ElementNode,
    prevNodeMap: null | NodeMap
  ): void {
    syncPropertiesFromLexical(
      binding,
      this._xmlText,
      this.getPrevNode(prevNodeMap),
      nextLexicalNode
    );
  }

  /**
   * Syncs children from the editor
   * @param binding Binding
   * @param nextLexicalNode Next node
   * @param prevNodeMap Previous node map
   * @param dirtyElements Dirty elements
   * @param dirtyLeaves Dirty leaves
   */
  syncChildrenFromLexical(
    binding: Binding,
    nextLexicalNode: ElementNode,
    prevNodeMap: null | NodeMap,
    dirtyElements: null | Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
    dirtyLeaves: null | Set<NodeKey>
  ): void {
    const prevLexicalNode = this.getPrevNode(prevNodeMap);
    const prevChildren =
      prevLexicalNode === null
        ? []
        : createChildrenArray(prevLexicalNode, prevNodeMap);
    const nextChildren = createChildrenArray(nextLexicalNode, null);
    const prevEndIndex = prevChildren.length - 1;
    const nextEndIndex = nextChildren.length - 1;
    const collabNodeMap = binding.collabNodeMap;
    let prevChildrenSet: Set<NodeKey> | undefined;
    let nextChildrenSet: Set<NodeKey> | undefined;
    let prevIndex = 0;
    let nextIndex = 0;

    while (prevIndex <= prevEndIndex && nextIndex <= nextEndIndex) {
      const prevKey = prevChildren[prevIndex];
      const nextKey = nextChildren[nextIndex];

      if (prevKey === nextKey) {
        // Move, create or remove
        this.syncChildFromLexical(
          binding,
          nextIndex,
          nextKey,
          prevNodeMap,
          dirtyElements,
          dirtyLeaves
        );

        prevIndex++;
        nextIndex++;
      } else {
        if (prevChildrenSet === undefined) {
          prevChildrenSet = new Set(prevChildren);
        }

        if (nextChildrenSet === undefined) {
          nextChildrenSet = new Set(nextChildren);
        }

        const nextHasPrevKey = nextChildrenSet.has(prevKey);
        const prevHasNextKey = prevChildrenSet.has(nextKey);

        if (!nextHasPrevKey) {
          // Remove
          this.splice(binding, nextIndex, 1);
          prevIndex++;
        } else {
          // Create or replace
          const nextChildNode = $getNodeByKeyOrThrow(nextKey);
          const collabNode = $createCollabNodeFromLexicalNode(
            binding,
            nextChildNode,
            this
          );

          collabNodeMap.set(nextKey, collabNode);

          if (prevHasNextKey) {
            this.splice(binding, nextIndex, 1, collabNode);
            prevIndex++;
            nextIndex++;
          } else {
            this.splice(binding, nextIndex, 0, collabNode);
            nextIndex++;
          }
        }
      }
    }

    const appendNewChildren = prevIndex > prevEndIndex;
    const removeOldChildren = nextIndex > nextEndIndex;

    if (appendNewChildren && !removeOldChildren) {
      for (; nextIndex <= nextEndIndex; ++nextIndex) {
        const key = nextChildren[nextIndex];
        const nextChildNode = $getNodeByKeyOrThrow(key);
        const collabNode = $createCollabNodeFromLexicalNode(
          binding,
          nextChildNode,
          this
        );
        this.append(collabNode);
        collabNodeMap.set(key, collabNode);
      }
    } else if (removeOldChildren && !appendNewChildren) {
      for (let i = this._children.length - 1; i >= nextIndex; i--) {
        this.splice(binding, i, 1);
      }
    }
  }

  /**
   * Appends a new child collab node
   * @param collabNode Collab node
   */
  append(
    collabNode:
      | CollabElementNode
      | CollabDecoratorNode
      | CollabTextNode
      | CollabLineBreakNode
  ): void {
    const xmlText = this._xmlText;
    const children = this._children;
    const lastChild = children[children.length - 1];
    const offset =
      lastChild !== undefined ? lastChild.getOffset() + lastChild.getSize() : 0;

    if (collabNode instanceof CollabElementNode) {
      xmlText.insertEmbed(offset, collabNode._xmlText);
    } else if (collabNode instanceof CollabTextNode) {
      const map = collabNode._map;

      if (map.parent === null) {
        xmlText.insertEmbed(offset, map);
      }

      xmlText.insert(offset + 1, collabNode._text);
    } else if (collabNode instanceof CollabLineBreakNode) {
      xmlText.insertEmbed(offset, collabNode._map);
    } else {
      xmlText.insertEmbed(offset, collabNode._xmlElem);
    }

    this._children.push(collabNode);
  }

  /**
   * Splices a child collab node
   * @param binding Binding
   * @param index Index
   * @param delCount Delete count
   * @param collabNode Child collab node
   */
  splice(
    binding: Binding,
    index: number,
    delCount: number,
    collabNode?:
      | CollabElementNode
      | CollabDecoratorNode
      | CollabTextNode
      | CollabLineBreakNode
  ): void {
    const children = this._children;
    const child = children[index];

    if (child === undefined) {
      if (collabNode === undefined) {
        throw new Error("`splice`: could not find the collab element node");
      }

      this.append(collabNode);
      return;
    }

    const offset = child.getOffset();

    if (offset === -1) {
      throw new Error("`splice`: expected offset to be greater than zero");
    }

    const xmlText = this._xmlText;

    if (delCount !== 0) {
      xmlText.delete(offset, child.getSize());
    }

    if (collabNode instanceof CollabElementNode) {
      xmlText.insertEmbed(offset, collabNode._xmlText);
    } else if (collabNode instanceof CollabTextNode) {
      const map = collabNode._map;

      if (map.parent === null) {
        xmlText.insertEmbed(offset, map);
      }

      xmlText.insert(offset + 1, collabNode._text);
    } else if (collabNode instanceof CollabLineBreakNode) {
      xmlText.insertEmbed(offset, collabNode._map);
    } else if (collabNode instanceof CollabDecoratorNode) {
      xmlText.insertEmbed(offset, collabNode._xmlElem);
    }

    if (delCount !== 0) {
      const childrenToDelete = children.slice(index, index + delCount);

      for (let i = 0; i < childrenToDelete.length; i++) {
        childrenToDelete[i].destroy(binding);
      }
    }

    if (collabNode !== undefined) {
      children.splice(index, delCount, collabNode);
    } else {
      children.splice(index, delCount);
    }
  }

  /**
   * Returns the child node offset
   * @param collabNode Child collab node
   */
  getChildOffset(
    collabNode:
      | CollabElementNode
      | CollabTextNode
      | CollabDecoratorNode
      | CollabLineBreakNode
  ): number {
    let offset = 0;
    const children = this._children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (child === collabNode) {
        return offset;
      }

      offset += child.getSize();
    }

    return -1;
  }

  /**
   * Syncs children from the editor
   * @param binding Binding
   * @param index Index
   * @param key Node key
   * @param prevNodeMap Previous node map
   * @param dirtyElements Dirty elements
   * @param dirtyLeaves Dirty leaves
   */
  private syncChildFromLexical(
    binding: Binding,
    index: number,
    key: NodeKey,
    prevNodeMap: null | NodeMap,
    dirtyElements: null | Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
    dirtyLeaves: null | Set<NodeKey>
  ): void {
    const childCollabNode = this._children[index];
    // Update
    const nextChildNode = $getNodeByKeyOrThrow(key);

    if (
      childCollabNode instanceof CollabElementNode &&
      $isElementNode(nextChildNode)
    ) {
      childCollabNode.syncPropertiesFromLexical(
        binding,
        nextChildNode,
        prevNodeMap
      );

      childCollabNode.syncChildrenFromLexical(
        binding,
        nextChildNode,
        prevNodeMap,
        dirtyElements,
        dirtyLeaves
      );
    } else if (
      childCollabNode instanceof CollabTextNode &&
      $isTextNode(nextChildNode)
    ) {
      childCollabNode.syncPropertiesAndTextFromLexical(
        binding,
        nextChildNode,
        prevNodeMap
      );
    } else if (
      childCollabNode instanceof CollabDecoratorNode &&
      $isDecoratorNode(nextChildNode)
    ) {
      childCollabNode.syncPropertiesFromLexical(
        binding,
        nextChildNode,
        prevNodeMap
      );
    }
  }

  /**
   * Destroys the node
   * @param binding Binding
   */
  destroy(binding: Binding): void {
    const collabNodeMap = binding.collabNodeMap;
    const children = this._children;

    for (let i = 0; i < children.length; i++) {
      children[i].destroy(binding);
    }

    collabNodeMap.delete(this._key);
  }
}

/**
 * Creates a new collab element node
 * @param xmlText XML text
 * @param parent Parent node
 * @param type Node type
 */
export const $createCollabElementNode = (
  xmlText: XmlText,
  parent: null | CollabElementNode,
  type: string
): CollabElementNode => {
  const collabNode = new CollabElementNode(xmlText, parent, type);
  // @ts-expect-error: internal field
  xmlText._collabNode = collabNode;
  return collabNode;
};
