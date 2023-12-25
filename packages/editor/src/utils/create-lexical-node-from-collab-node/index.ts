import {
  DecoratorNode,
  ElementNode,
  LexicalNode,
  NodeKey,
  TextNode
} from "lexical";

import { Binding } from "../../collaboration/bindings";
import { CollabDecoratorNode } from "../../collaboration/nodes/decorator";
import { CollabElementNode } from "../../collaboration/nodes/element";
import { CollabLineBreakNode } from "../../collaboration/nodes/line-break";
import { CollabTextNode } from "../../collaboration/nodes/text";

/**
 * Creates a lexical node from a collab node
 * @param binding Binding
 * @param collab_node Collab node
 * @param parent_key Parent node key
 */
export const create_lexical_node_from_collab_node = (
  binding: Binding,
  collab_node:
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode,
  parent_key: NodeKey
): LexicalNode => {
  const type = collab_node.get_type();
  const registered_nodes = binding.editor._nodes;
  const node_info = registered_nodes.get(type);

  if (!node_info) {
    throw new Error(`Node ${type} is not registered`);
  }

  const lexical_node:
    | DecoratorNode<unknown>
    | TextNode
    | ElementNode
    | LexicalNode = new node_info.klass(); // This creates an editor node instance without ctor arguments
  lexical_node.__parent = parent_key;
  collab_node._key = lexical_node.__key;

  if (collab_node instanceof CollabElementNode) {
    const xml_text = collab_node._xml_text;
    collab_node.sync_properties_from_yjs(binding, null);
    collab_node.apply_children_yjs_delta(binding, xml_text.toDelta());
    collab_node.sync_children_from_yjs(binding);
  } else if (collab_node instanceof CollabTextNode) {
    collab_node.sync_properties_and_text_from_yjs(binding, null);
  } else if (collab_node instanceof CollabDecoratorNode) {
    collab_node.sync_properties_from_yjs(binding, null);
  }

  binding.collab_node_map.set(lexical_node.__key, collab_node);
  return lexical_node;
};
