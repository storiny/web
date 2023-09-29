import {
  $isDecoratorNode as $is_decorator_node,
  $isElementNode as $is_element_node,
  $isLineBreakNode as $is_line_break_node,
  $isTextNode as $is_text_node,
  LexicalNode
} from "lexical";
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

/**
 * Creates a collab node from a lexical node
 * @param binding Binding
 * @param lexical_node Lexical node
 * @param parent Parent collab node
 */
export const $create_collab_node_from_lexical_node = (
  binding: Binding,
  lexical_node: LexicalNode,
  parent: CollabElementNode
):
  | CollabElementNode
  | CollabTextNode
  | CollabLineBreakNode
  | CollabDecoratorNode => {
  const nodeType = lexical_node.__type;
  let collab_node;

  if ($is_element_node(lexical_node)) {
    const xml_text = new XmlText();
    collab_node = $create_collab_element_node(xml_text, parent, nodeType);
    collab_node.sync_properties_from_lexical(binding, lexical_node, null);
    collab_node.sync_children_from_lexical(
      binding,
      lexical_node,
      null,
      null,
      null
    );
  } else if ($is_text_node(lexical_node)) {
    // TODO: Create a token text node for `token`, `segmented` nodes
    const map = new YMap();

    collab_node = $create_collab_text_node(
      map,
      lexical_node.__text,
      parent,
      nodeType
    );
    collab_node.sync_properties_and_text_from_lexical(
      binding,
      lexical_node,
      null
    );
  } else if ($is_line_break_node(lexical_node)) {
    const map = new YMap();
    map.set("__type", "linebreak");
    collab_node = $create_collab_line_break_node(map, parent);
  } else if ($is_decorator_node(lexical_node)) {
    const xml_element = new XmlElement(lexical_node.getType());
    collab_node = $create_collab_decorator_node(xml_element, parent, nodeType);
    collab_node.sync_properties_from_lexical(binding, lexical_node, null);
  } else {
    throw new Error("Expected text, element, decorator, or a linebreak node");
  }

  collab_node._key = lexical_node.__key;
  return collab_node;
};
