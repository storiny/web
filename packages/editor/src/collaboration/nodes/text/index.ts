import {
  $getNodeByKey as $get_node_by_key,
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  $isTextNode as $is_text_node,
  NodeKey,
  NodeMap,
  TextModeType,
  TextNode
} from "lexical";
import { Map as YMap } from "yjs";

import { simple_diff_with_cursor } from "../../../utils/simple-diff-with-cursor";
import { sync_properties_from_lexical } from "../../../utils/sync-properties-from-lexical";
import { sync_properties_from_yjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabElementNode } from "../element";

/**
 * Diffs the text content of the node
 * @param collab_node Collab text node
 * @param key Node key
 * @param prev_text Previous text
 * @param next_text Next text
 */
const diff_text_content_and_apply_delta = (
  collab_node: CollabTextNode,
  key: NodeKey,
  prev_text: string,
  next_text: string
): void => {
  const selection = $get_selection();
  let cursor_offset = next_text.length;

  if ($is_range_selection(selection) && selection.isCollapsed()) {
    const anchor = selection.anchor;

    if (anchor.key === key) {
      cursor_offset = anchor.offset;
    }
  }

  const diff = simple_diff_with_cursor(prev_text, next_text, cursor_offset);
  collab_node.splice_text(diff.index, diff.remove, diff.insert);
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
   * Node text
   */
  public _text: string;
  /**
   * Node type
   */
  private readonly _type: string;
  /**
   * Normalized flag
   */
  public _normalized: boolean;

  /**
   * Returns the previous text node
   * @param node_map Node map
   */
  public get_prev_node(node_map: null | NodeMap): null | TextNode {
    if (node_map === null) {
      return null;
    }

    const node = node_map.get(this._key);
    return $is_text_node(node) ? node : null;
  }

  /**
   * Returns the text node
   */
  public get_node(): null | TextNode {
    const node = $get_node_by_key(this._key);
    return $is_text_node(node) ? node : null;
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
   * Returns the node key
   */
  public get_key(): NodeKey {
    return this._key;
  }

  /**
   * Returns the node size
   */
  public get_size(): number {
    return this._text.length + (this._normalized ? 0 : 1);
  }

  /**
   * Returns the node offset
   */
  public get_offset(): number {
    const collab_element_node = this._parent;
    return collab_element_node.get_child_offset(this);
  }

  /**
   * Slices node text content
   * @param index Index
   * @param del_count Delete count
   * @param next_text New text
   */
  public splice_text(
    index: number,
    del_count: number,
    next_text: string
  ): void {
    const collab_element_node = this._parent;
    const xml_text = collab_element_node._xml_text;
    const offset = this.get_offset() + 1 + index;

    if (del_count !== 0) {
      xml_text.delete(offset, del_count);
    }

    if (next_text !== "") {
      xml_text.insert(offset, next_text);
    }
  }

  /**
   * Syncs properties and text from editor
   * @param binding Binding
   * @param next_lexical_node Next node
   * @param prev_node_map Previous node map
   */
  public sync_properties_and_text_from_lexical(
    binding: Binding,
    next_lexical_node: TextNode,
    prev_node_map: null | NodeMap
  ): void {
    const prev_lexical_node = this.get_prev_node(prev_node_map);

    sync_properties_from_lexical(
      binding,
      this._map,
      prev_lexical_node,
      next_lexical_node
    );

    if (prev_lexical_node !== null) {
      const prev_text = prev_lexical_node.__text;
      const next_text = next_lexical_node.__text;

      if (prev_text !== next_text) {
        const key = next_lexical_node.__key;
        diff_text_content_and_apply_delta(this, key, prev_text, next_text);
        this._text = next_text;
      }
    }
  }

  /**
   * Syncs properties and text from yjs
   * @param binding Binding
   * @param keys_changed Set of changed keys
   */
  public sync_properties_and_text_from_yjs(
    binding: Binding,
    keys_changed: null | Set<string>
  ): void {
    const lexical_node = this.get_node();

    if (lexical_node === null) {
      throw new Error(
        "`sync_properties_and_text_from_yjs`: could not find the text node"
      );
    }

    sync_properties_from_yjs(binding, this._map, lexical_node, keys_changed);
    const collab_text = this._text;

    if (lexical_node.__text !== collab_text) {
      const writable = lexical_node.getWritable();
      writable.__text = collab_text;
    }
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
 * Creates a new collab text node
 * @param map YMap
 * @param text Node text
 * @param parent Parent node
 * @param type Node type
 */
export const $create_collab_text_node = (
  map: YMap<unknown>,
  text: string,
  parent: CollabElementNode,
  type: string
): CollabTextNode => {
  const collab_node = new CollabTextNode(map, text, parent, type);
  map._collab_node = collab_node;
  return collab_node;
};
