import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  NodeKey,
  NodeMap,
  TextNode
} from "lexical";
import { Map as YMap } from "yjs";

import { simpleDiffWithCursor } from "../../../utils/simple-diff-with-cursor";
import { syncPropertiesFromLexical } from "../../../utils/sync-properties-from-lexical";
import { syncPropertiesFromYjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabElementNode } from "../element";

/**
 * Diffs the text content of the node
 * @param collabNode Collab text node
 * @param key Node key
 * @param prevText Previous text
 * @param nextText Next text
 */
const diffTextContentAndApplyDelta = (
  collabNode: CollabTextNode,
  key: NodeKey,
  prevText: string,
  nextText: string
): void => {
  const selection = $getSelection();
  let cursorOffset = nextText.length;

  if ($isRangeSelection(selection) && selection.isCollapsed()) {
    const anchor = selection.anchor;

    if (anchor.key === key) {
      cursorOffset = anchor.offset;
    }
  }

  const diff = simpleDiffWithCursor(prevText, nextText, cursorOffset);
  collabNode.spliceText(diff.index, diff.remove, diff.insert);
};

export class CollabTextNode {
  /**
   * Ctor
   * @param map YMap
   * @param text Text
   * @param parent Parent node
   * @param type Type
   */
  constructor(
    map: YMap<unknown>,
    text: string,
    parent: CollabElementNode,
    type: string
  ) {
    this._key = "";
    this._map = map;
    this._parent = parent;
    this._text = text;
    this._type = type;
    this._normalized = false;
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
   * Node text
   */
  _text: string;
  /**
   * Node type
   */
  _type: string;
  /**
   * Normalized flag
   */
  _normalized: boolean;

  /**
   * Returns the previous text node
   * @param nodeMap Node map
   */
  getPrevNode(nodeMap: null | NodeMap): null | TextNode {
    if (nodeMap === null) {
      return null;
    }

    const node = nodeMap.get(this._key);
    return $isTextNode(node) ? node : null;
  }

  /**
   * Returns the text node
   */
  getNode(): null | TextNode {
    const node = $getNodeByKey(this._key);
    return $isTextNode(node) ? node : null;
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
   * Returns the node key
   */
  getKey(): NodeKey {
    return this._key;
  }

  /**
   * Returns the node size
   */
  getSize(): number {
    return this._text.length + (this._normalized ? 0 : 1);
  }

  /**
   * Returns the node offset
   */
  getOffset(): number {
    const collabElementNode = this._parent;
    return collabElementNode.getChildOffset(this);
  }

  /**
   * Slices node text content
   * @param index Index
   * @param delCount Delete count
   * @param newText New text
   */
  spliceText(index: number, delCount: number, newText: string): void {
    const collabElementNode = this._parent;
    const xmlText = collabElementNode._xmlText;
    const offset = this.getOffset() + 1 + index;

    if (delCount !== 0) {
      xmlText.delete(offset, delCount);
    }

    if (newText !== "") {
      xmlText.insert(offset, newText);
    }
  }

  /**
   * Syncs properties and text from editor
   * @param binding Binding
   * @param nextLexicalNode Next node
   * @param prevNodeMap Previous node map
   */
  syncPropertiesAndTextFromLexical(
    binding: Binding,
    nextLexicalNode: TextNode,
    prevNodeMap: null | NodeMap
  ): void {
    const prevLexicalNode = this.getPrevNode(prevNodeMap);
    const nextText = nextLexicalNode.__text;

    syncPropertiesFromLexical(
      binding,
      this._map,
      prevLexicalNode,
      nextLexicalNode
    );

    if (prevLexicalNode !== null) {
      const prevText = prevLexicalNode.__text;

      if (prevText !== nextText) {
        const key = nextLexicalNode.__key;
        diffTextContentAndApplyDelta(this, key, prevText, nextText);
        this._text = nextText;
      }
    }
  }

  /**
   * Syncs properties and text from yjs
   * @param binding Binding
   * @param keysChanged Set of changed keys
   */
  syncPropertiesAndTextFromYjs(
    binding: Binding,
    keysChanged: null | Set<string>
  ): void {
    const lexicalNode = this.getNode();

    if (lexicalNode === null) {
      throw new Error(
        "`syncPropertiesAndTextFromYjs`: could not find the text node"
      );
    }

    syncPropertiesFromYjs(binding, this._map, lexicalNode, keysChanged);
    const collabText = this._text;

    if (lexicalNode.__text !== collabText) {
      const writable = lexicalNode.getWritable();
      writable.__text = collabText;
    }
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
 * Creates a new collab text node
 * @param map YMap
 * @param text Node text
 * @param parent Parent node
 * @param type Node type
 */
export const $createCollabTextNode = (
  map: YMap<unknown>,
  text: string,
  parent: CollabElementNode,
  type: string
): CollabTextNode => {
  const collabNode = new CollabTextNode(map, text, parent, type);
  // @ts-expect-error: internal field
  map._collabNode = collabNode;
  return collabNode;
};
