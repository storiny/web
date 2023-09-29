import { Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collaboration/bindings";
import {
  $create_collab_decorator_node,
  CollabDecoratorNode
} from "../../collaboration/nodes/decorator";
import {
  $create_collab_element_node,
  CollabElementNode
} from "../../collaboration/nodes/element";
import {
  $create_collab_line_break_node,
  CollabLineBreakNode
} from "../../collaboration/nodes/line-break";
import {
  $create_collab_text_node,
  CollabTextNode
} from "../../collaboration/nodes/text";
import { get_node_type_from_shared_type } from "../get-node-type-from-shared-type";

/**
 * Returns initialized collab node from the shared type
 * @param binding Binding
 * @param shared_type Shared type
 * @param parent Parent node
 */
export const get_or_create_collab_node_from_shared_type = (
  binding: Binding,
  shared_type: XmlText | YMap<unknown> | XmlElement,
  parent?: CollabElementNode
):
  | CollabElementNode
  | CollabTextNode
  | CollabLineBreakNode
  | CollabDecoratorNode => {
  const collab_node = shared_type._collab_node;

  if (collab_node === undefined) {
    const registered_nodes = binding.editor._nodes;
    const type = get_node_type_from_shared_type(shared_type);
    const node_info = registered_nodes.get(type);

    if (!node_info) {
      throw new Error(`Node ${type} is not registered`);
    }

    const shared_parent = shared_type.parent;
    const target_parent =
      parent === undefined && shared_parent !== null
        ? get_or_create_collab_node_from_shared_type(
            binding,
            shared_parent as XmlText | YMap<unknown> | XmlElement
          )
        : parent || null;

    if (!(target_parent instanceof CollabElementNode)) {
      throw new Error("Expected parent to be a collab element node");
    }

    if (shared_type instanceof XmlText) {
      return $create_collab_element_node(shared_type, target_parent, type);
    } else if (shared_type instanceof YMap) {
      if (type === "linebreak") {
        return $create_collab_line_break_node(shared_type, target_parent);
      }

      return $create_collab_text_node(shared_type, "", target_parent, type);
    } else if ((shared_type as unknown) instanceof XmlElement) {
      return $create_collab_decorator_node(shared_type, target_parent, type);
    }
  }

  return collab_node;
};
