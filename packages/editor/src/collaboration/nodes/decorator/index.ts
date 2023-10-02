import {
  $getNodeByKey as $get_node_by_key,
  $isDecoratorNode as $is_decorator_node,
  DecoratorNode,
  NodeKey,
  NodeMap
} from "lexical";
import { XmlElement } from "yjs";

import { sync_properties_from_lexical } from "../../../utils/sync-properties-from-lexical";
import { sync_properties_from_yjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabElementNode } from "../element";

export class CollabDecoratorNode {
  /**
   * Ctor
   * @param xml_element XML element
   * @param parent Parent node
   * @param type Node type
   */
  constructor(
    xml_element: XmlElement,
    parent: CollabElementNode,
    type: string
  ) {
    this._key = "";
    this._xml_elem = xml_element;
    this._parent = parent;
    this._type = type;
  }

  /**
   * XML element
   */
  public _xml_elem: XmlElement;
  /**
   * Node key
   */
  public _key: NodeKey;
  /**
   * Parent node
   */
  public _parent: CollabElementNode;
  /**
   * Node type
   */
  public _type: string;

  /**
   * Returns the previous node
   * @param node_map Node map
   */
  public get_prev_node(
    node_map: null | NodeMap
  ): null | DecoratorNode<unknown> {
    if (node_map === null) {
      return null;
    }

    const node = node_map.get(this._key);
    return $is_decorator_node(node) ? node : null;
  }

  /**
   * Returns the node
   */
  public get_node(): null | DecoratorNode<unknown> {
    const node = $get_node_by_key(this._key);
    return $is_decorator_node(node) ? node : null;
  }

  /**
   * Returns the shared type
   */
  public get_shared_type(): XmlElement {
    return this._xml_elem;
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
    next_lexical_node: DecoratorNode<unknown>,
    prev_node_map: null | NodeMap
  ): void {
    const prev_lexical_node = this.get_prev_node(prev_node_map);
    const xml_element = this._xml_elem;
    sync_properties_from_lexical(
      binding,
      xml_element,
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
    const xml_element = this._xml_elem;

    if (lexical_node === null) {
      throw new Error(
        "`sync_properties_from_yjs`: could not find the decorator node"
      );
    }

    sync_properties_from_yjs(binding, xml_element, lexical_node, keys_changed);
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
 * Creates a new collab decorator node
 * @param xml_element XML element
 * @param parent Parent node
 * @param type Node type
 */
export const $create_collab_decorator_node = (
  xml_element: XmlElement,
  parent: CollabElementNode,
  type: string
): CollabDecoratorNode => {
  const node = new CollabDecoratorNode(xml_element, parent, type);
  xml_element._collab_node = node;
  return node;
};
