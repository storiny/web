import {
  $getNodeByKey as $get_node_by_key,
  $isDecoratorNode as $is_decorator_node,
  $isElementNode as $is_element_node,
  $isTextNode as $is_text_node,
  ElementNode,
  NodeKey,
  NodeMap
} from "lexical";
import { AbstractType, XmlElement, XmlText } from "yjs";
import { YMap } from "yjs/dist/src/internals";

import { create_children_array } from "../../../utils/create-children-array";
import { $create_collab_node_from_lexical_node } from "../../../utils/create-collab-node-from-lexical-node";
import { create_lexical_node_from_collab_node } from "../../../utils/create-lexical-node-from-collab-node";
import { $get_node_by_key_or_throw } from "../../../utils/get-node-by-key-or-throw";
import { get_or_create_collab_node_from_shared_type } from "../../../utils/get-or-create-collab-node-from-shared-type";
import { get_position_from_element_and_offset } from "../../../utils/get-position-from-element-and-offset";
import { remove_from_parent } from "../../../utils/remove-from-parent";
import { splice_string } from "../../../utils/splice-string";
import { sync_properties_from_lexical } from "../../../utils/sync-properties-from-lexical";
import { sync_properties_from_yjs } from "../../../utils/sync-properties-from-yjs";
import { Binding } from "../../bindings";
import { CollabDecoratorNode } from "../decorator";
import { CollabLineBreakNode } from "../line-break";
import { CollabTextNode } from "../text";

type IntentionallyMarkedAsDirtyElement = boolean;

export class CollabElementNode {
  /**
   * Ctor
   * @param xml_text XML text
   * @param parent Parent node
   * @param type Node type
   */
  constructor(
    xml_text: XmlText,
    parent: null | CollabElementNode,
    type: string
  ) {
    this._key = "";
    this._children = [];
    this._xml_text = xml_text;
    this._type = type;
    this._parent = parent;
  }

  /**
   * Node key
   */
  public _key: NodeKey;
  /**
   * Node children
   */
  public _children: Array<
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
  >;
  /**
   * XML text
   */
  public _xml_text: XmlText;
  /**
   * Node type
   */
  private readonly _type: string;
  /**
   * Parent node
   */
  public _parent: null | CollabElementNode;

  /**
   * Returns the previous node
   * @param node_map Node map
   */
  public get_prev_node(node_map: null | NodeMap): null | ElementNode {
    if (node_map === null) {
      return null;
    }

    const node = node_map.get(this._key);
    return $is_element_node(node) ? node : null;
  }

  /**
   * Returns the node
   */
  public get_node(): null | ElementNode {
    const node = $get_node_by_key(this._key);
    return $is_element_node(node) ? node : null;
  }

  /**
   * Returns the shared type
   */
  public get_shared_type(): XmlText {
    return this._xml_text;
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
   * Predicate method for determining whether the node is empty
   */
  public is_empty(): boolean {
    return this._children.length === 0;
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

    if (collab_element_node === null) {
      throw new Error("`getOffset`: could not find the collab element node");
    }

    return collab_element_node.get_child_offset(this);
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

    if (lexical_node === null) {
      throw new Error(
        "`sync_properties_from_yjs`: could not find the collab element node"
      );
    }

    sync_properties_from_yjs(
      binding,
      this._xml_text,
      lexical_node,
      keys_changed
    );
  }

  /**
   * Applies children yjs delta
   * @param binding Binding
   * @param deltas Yjs deltas
   */
  public apply_children_yjs_delta(
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
    let curr_index = 0;

    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      const insert_delta = delta.insert;
      const delete_delta = delta.delete;

      if (delta.retain != null) {
        curr_index += delta.retain;
      } else if (typeof delete_delta === "number") {
        let deletion_size = delete_delta;

        while (deletion_size > 0) {
          const { node, node_index, offset, length } =
            get_position_from_element_and_offset(this, curr_index, false);

          if (
            node instanceof CollabElementNode ||
            node instanceof CollabLineBreakNode ||
            node instanceof CollabDecoratorNode
          ) {
            children.splice(node_index, 1);
            deletion_size -= 1;
          } else if (node instanceof CollabTextNode) {
            const del_count = Math.min(deletion_size, length);
            const prev_collab_node =
              node_index !== 0 ? children[node_index - 1] : null;
            const node_size = node.get_size();

            if (
              offset === 0 &&
              del_count === 1 &&
              node_index > 0 &&
              prev_collab_node instanceof CollabTextNode &&
              length === node_size &&
              // If the node has no keys, it's been deleted
              Array.from(node._map.keys()).length === 0
            ) {
              // Merge the text node with previous
              prev_collab_node._text += node._text;
              children.splice(node_index, 1);
            } else if (offset === 0 && del_count === node_size) {
              // The entire thing needs to be removed
              children.splice(node_index, 1);
            } else {
              node._text = splice_string(node._text, offset, del_count, "");
            }

            deletion_size -= del_count;
          } else {
            // Can occur due to the deletion from the dangling text heuristic
            // below
            break;
          }
        }
      } else if (insert_delta != null) {
        if (typeof insert_delta === "string") {
          const { node, offset } = get_position_from_element_and_offset(
            this,
            curr_index,
            true
          );

          if (node instanceof CollabTextNode) {
            node._text = splice_string(node._text, offset, 0, insert_delta);
          } else {
            /**
             * TODO: Maybe we can improve this by keeping around a redundant
             *   text node map, rather than removing all the text nodes, so
             *   there never can be dangling text.
             *
             * We have a conflict where there was likely a `CollabTextNode` and
             * a Lexical TextNode too, but they were removed in a merge. So
             * let's just ignore the text and trigger a removal for it from our
             * shared type
             */
            this._xml_text.delete(offset, insert_delta.length);
          }

          curr_index += insert_delta.length;
        } else {
          const shared_type = insert_delta;
          const { node_index } = get_position_from_element_and_offset(
            this,
            curr_index,
            false
          );
          const collab_node = get_or_create_collab_node_from_shared_type(
            binding,
            shared_type as XmlText | YMap<unknown> | XmlElement,
            this
          );

          children.splice(node_index, 0, collab_node);
          curr_index += 1;
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
  public sync_children_from_yjs(binding: Binding): void {
    // Diff the children of the collab node with that of our existing Lexical
    // node
    const lexical_node = this.get_node();

    if (lexical_node === null) {
      throw new Error(
        "`sync_children_from_yjs`: could not find the element node"
      );
    }

    const key = lexical_node.__key;
    const prev_lexical_children_keys = create_children_array(
      lexical_node,
      null
    );
    const lexical_children_keys_length = prev_lexical_children_keys.length;
    const collab_children = this._children;
    const collab_children_length = collab_children.length;
    const collab_node_map = binding.collab_node_map;
    const visited_keys = new Set();
    let collab_keys;
    let writable_lexical_node;
    let prev_index = 0;
    let prev_child_node = null;

    if (collab_children_length !== lexical_children_keys_length) {
      writable_lexical_node = lexical_node.getWritable();
    }

    for (let i = 0; i < collab_children_length; i++) {
      const lexical_child_key = prev_lexical_children_keys[prev_index];
      const child_collab_node = collab_children[i];
      const collab_lexical_child_node = child_collab_node.get_node();
      const collab_key = child_collab_node._key;

      if (
        collab_lexical_child_node !== null &&
        lexical_child_key === collab_key
      ) {
        const child_needs_updating = $is_text_node(collab_lexical_child_node);
        // Update
        visited_keys.add(lexical_child_key);

        if (child_needs_updating) {
          child_collab_node._key = lexical_child_key;

          if (child_collab_node instanceof CollabElementNode) {
            const xml_text = child_collab_node._xml_text;
            child_collab_node.sync_properties_from_yjs(binding, null);
            child_collab_node.apply_children_yjs_delta(
              binding,
              xml_text.toDelta()
            );
            child_collab_node.sync_children_from_yjs(binding);
          } else if (child_collab_node instanceof CollabTextNode) {
            child_collab_node.sync_properties_and_text_from_yjs(binding, null);
          } else if (child_collab_node instanceof CollabDecoratorNode) {
            child_collab_node.sync_properties_from_yjs(binding, null);
          } else if (
            !((child_collab_node as unknown) instanceof CollabLineBreakNode)
          ) {
            throw new Error("`sync_children_from_yjs`: unknown collab node");
          }
        }

        prev_child_node = collab_lexical_child_node;
        prev_index++;
      } else {
        if (collab_keys === undefined) {
          collab_keys = new Set();

          for (let s = 0; s < collab_children_length; s++) {
            const child = collab_children[s];
            const child_key = child._key;

            if (child_key !== "") {
              collab_keys.add(child_key);
            }
          }
        }

        if (
          collab_lexical_child_node !== null &&
          lexical_child_key !== undefined &&
          !collab_keys.has(lexical_child_key)
        ) {
          const node_to_remove = $get_node_by_key_or_throw(lexical_child_key);
          remove_from_parent(node_to_remove);
          i--;
          prev_index++;
          continue;
        }

        writable_lexical_node = lexical_node.getWritable();

        // Create/Replace
        const lexical_child_node = create_lexical_node_from_collab_node(
          binding,
          child_collab_node,
          key
        );
        const child_key = lexical_child_node.__key;

        collab_node_map.set(child_key, child_collab_node);

        if (prev_child_node === null) {
          const nextSibling = writable_lexical_node.getFirstChild();
          writable_lexical_node.__first = child_key;

          if (nextSibling !== null) {
            const writable_next_sibling = nextSibling.getWritable();
            writable_next_sibling.__prev = child_key;
            lexical_child_node.__next = writable_next_sibling.__key;
          }
        } else {
          const writable_prev_child_node = prev_child_node.getWritable();
          const nextSibling = prev_child_node.getNextSibling();

          writable_prev_child_node.__next = child_key;
          lexical_child_node.__prev = prev_child_node.__key;

          if (nextSibling !== null) {
            const writable_next_sibling = nextSibling.getWritable();
            writable_next_sibling.__prev = child_key;
            lexical_child_node.__next = writable_next_sibling.__key;
          }
        }

        if (i === collab_children_length - 1) {
          writable_lexical_node.__last = child_key;
        }

        writable_lexical_node.__size++;
        prev_child_node = lexical_child_node;
      }
    }

    for (let i = 0; i < lexical_children_keys_length; i++) {
      const lexical_child_key = prev_lexical_children_keys[i];

      if (!visited_keys.has(lexical_child_key)) {
        // Remove
        const lexical_child_node = $get_node_by_key_or_throw(lexical_child_key);
        const collab_node = binding.collab_node_map.get(lexical_child_key);

        if (collab_node !== undefined) {
          collab_node.destroy(binding);
        }

        remove_from_parent(lexical_child_node);
      }
    }
  }

  /**
   * Syncs properties from the editor
   * @param binding Binding
   * @param next_lexical_node Next node
   * @param prev_node_map Previous node map
   */
  public sync_properties_from_lexical(
    binding: Binding,
    next_lexical_node: ElementNode,
    prev_node_map: null | NodeMap
  ): void {
    sync_properties_from_lexical(
      binding,
      this._xml_text,
      this.get_prev_node(prev_node_map),
      next_lexical_node
    );
  }

  /**
   * Syncs children from the editor
   * @param binding Binding
   * @param next_lexical_node Next node
   * @param prev_node_map Previous node map
   * @param dirty_elements Dirty elements
   * @param dirty_leaves Dirty leaves
   */
  public sync_children_from_lexical(
    binding: Binding,
    next_lexical_node: ElementNode,
    prev_node_map: null | NodeMap,
    dirty_elements: null | Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
    dirty_leaves: null | Set<NodeKey>
  ): void {
    const prev_lexical_node = this.get_prev_node(prev_node_map);
    const prev_children =
      prev_lexical_node === null
        ? []
        : create_children_array(prev_lexical_node, prev_node_map);
    const next_children = create_children_array(next_lexical_node, null);
    const prev_end_index = prev_children.length - 1;
    const next_end_index = next_children.length - 1;
    const collab_node_map = binding.collab_node_map;
    let prev_children_set: Set<NodeKey> | undefined;
    let next_children_set: Set<NodeKey> | undefined;
    let prev_index = 0;
    let next_index = 0;

    while (prev_index <= prev_end_index && next_index <= next_end_index) {
      const prev_key = prev_children[prev_index];
      const next_key = next_children[next_index];

      if (prev_key === next_key) {
        // Move, create or remove
        this.sync_child_from_lexical(
          binding,
          next_index,
          next_key,
          prev_node_map,
          dirty_elements,
          dirty_leaves
        );

        prev_index++;
        next_index++;
      } else {
        if (prev_children_set === undefined) {
          prev_children_set = new Set(prev_children);
        }

        if (next_children_set === undefined) {
          next_children_set = new Set(next_children);
        }

        const next_has_prev_key = next_children_set.has(prev_key);
        const prev_has_prev_key = prev_children_set.has(next_key);

        if (!next_has_prev_key) {
          // Remove
          this.splice(binding, next_index, 1);
          prev_index++;
        } else {
          // Create or replace
          const next_child_node = $get_node_by_key_or_throw(next_key);
          const collab_node = $create_collab_node_from_lexical_node(
            binding,
            next_child_node,
            this
          );

          collab_node_map.set(next_key, collab_node);

          if (prev_has_prev_key) {
            this.splice(binding, next_index, 1, collab_node);
            prev_index++;
            next_index++;
          } else {
            this.splice(binding, next_index, 0, collab_node);
            next_index++;
          }
        }
      }
    }

    const append_new_children = prev_index > prev_end_index;
    const remove_old_children = next_index > next_end_index;

    if (append_new_children && !remove_old_children) {
      for (; next_index <= next_end_index; ++next_index) {
        const key = next_children[next_index];
        const next_child_node = $get_node_by_key_or_throw(key);
        const collab_node = $create_collab_node_from_lexical_node(
          binding,
          next_child_node,
          this
        );
        this.append(collab_node);
        collab_node_map.set(key, collab_node);
      }
    } else if (remove_old_children && !append_new_children) {
      for (let i = this._children.length - 1; i >= next_index; i--) {
        this.splice(binding, i, 1);
      }
    }
  }

  /**
   * Appends a new child collab node
   * @param collab_node Collab node
   */
  private append(
    collab_node:
      | CollabElementNode
      | CollabDecoratorNode
      | CollabTextNode
      | CollabLineBreakNode
  ): void {
    const xml_text = this._xml_text;
    const children = this._children;
    const last_child = children[children.length - 1];
    const offset =
      last_child !== undefined
        ? last_child.get_offset() + last_child.get_size()
        : 0;

    if (collab_node instanceof CollabElementNode) {
      xml_text.insertEmbed(offset, collab_node._xml_text);
    } else if (collab_node instanceof CollabTextNode) {
      const map = collab_node._map;

      if (map.parent === null) {
        xml_text.insertEmbed(offset, map);
      }

      xml_text.insert(offset + 1, collab_node._text);
    } else if (collab_node instanceof CollabLineBreakNode) {
      xml_text.insertEmbed(offset, collab_node._map);
    } else {
      xml_text.insertEmbed(offset, collab_node._xml_elem);
    }

    this._children.push(collab_node);
  }

  /**
   * Splices a child collab node
   * @param binding Binding
   * @param index Index
   * @param del_count Delete count
   * @param collab_node Child collab node
   */
  private splice(
    binding: Binding,
    index: number,
    del_count: number,
    collab_node?:
      | CollabElementNode
      | CollabDecoratorNode
      | CollabTextNode
      | CollabLineBreakNode
  ): void {
    const children = this._children;
    const child = children[index];

    if (child === undefined) {
      if (collab_node === undefined) {
        throw new Error("`splice`: could not find the collab element node");
      }

      this.append(collab_node);
      return;
    }

    const offset = child.get_offset();

    if (offset === -1) {
      throw new Error("`splice`: expected offset to be greater than zero");
    }

    const xml_text = this._xml_text;

    if (del_count !== 0) {
      xml_text.delete(offset, child.get_size());
    }

    if (collab_node instanceof CollabElementNode) {
      xml_text.insertEmbed(offset, collab_node._xml_text);
    } else if (collab_node instanceof CollabTextNode) {
      const map = collab_node._map;

      if (map.parent === null) {
        xml_text.insertEmbed(offset, map);
      }

      xml_text.insert(offset + 1, collab_node._text);
    } else if (collab_node instanceof CollabLineBreakNode) {
      xml_text.insertEmbed(offset, collab_node._map);
    } else if (collab_node instanceof CollabDecoratorNode) {
      xml_text.insertEmbed(offset, collab_node._xml_elem);
    }

    if (del_count !== 0) {
      const children_to_delete = children.slice(index, index + del_count);

      for (let i = 0; i < children_to_delete.length; i++) {
        children_to_delete[i].destroy(binding);
      }
    }

    if (collab_node !== undefined) {
      children.splice(index, del_count, collab_node);
    } else {
      children.splice(index, del_count);
    }
  }

  /**
   * Returns the child node offset
   * @param collab_node Child collab node
   */
  public get_child_offset(
    collab_node:
      | CollabElementNode
      | CollabTextNode
      | CollabDecoratorNode
      | CollabLineBreakNode
  ): number {
    let offset = 0;
    const children = this._children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (child === collab_node) {
        return offset;
      }

      offset += child.get_size();
    }

    return -1;
  }

  /**
   * Syncs children from the editor
   * @param binding Binding
   * @param index Index
   * @param key Node key
   * @param prev_node_map Previous node map
   * @param dirty_elements Dirty elements
   * @param dirty_leaves Dirty leaves
   */
  private sync_child_from_lexical(
    binding: Binding,
    index: number,
    key: NodeKey,
    prev_node_map: null | NodeMap,
    dirty_elements: null | Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
    dirty_leaves: null | Set<NodeKey>
  ): void {
    const child_collab_node = this._children[index];
    // Update
    const next_child_node = $get_node_by_key_or_throw(key);

    if (
      child_collab_node instanceof CollabElementNode &&
      $is_element_node(next_child_node)
    ) {
      child_collab_node.sync_properties_from_lexical(
        binding,
        next_child_node,
        prev_node_map
      );

      child_collab_node.sync_children_from_lexical(
        binding,
        next_child_node,
        prev_node_map,
        dirty_elements,
        dirty_leaves
      );
    } else if (
      child_collab_node instanceof CollabTextNode &&
      $is_text_node(next_child_node)
    ) {
      child_collab_node.sync_properties_and_text_from_lexical(
        binding,
        next_child_node,
        prev_node_map
      );
    } else if (
      child_collab_node instanceof CollabDecoratorNode &&
      $is_decorator_node(next_child_node)
    ) {
      child_collab_node.sync_properties_from_lexical(
        binding,
        next_child_node,
        prev_node_map
      );
    }
  }

  /**
   * Destroys the node
   * @param binding Binding
   */
  public destroy(binding: Binding): void {
    const collab_node_map = binding.collab_node_map;
    const children = this._children;

    for (let i = 0; i < children.length; i++) {
      children[i].destroy(binding);
    }

    collab_node_map.delete(this._key);
  }
}

/**
 * Creates a new collab element node
 * @param xml_text XML text
 * @param parent Parent node
 * @param type Node type
 */
export const $create_collab_element_node = (
  xml_text: XmlText,
  parent: null | CollabElementNode,
  type: string
): CollabElementNode => {
  const collab_node = new CollabElementNode(xml_text, parent, type);
  xml_text._collab_node = collab_node;
  return collab_node;
};
