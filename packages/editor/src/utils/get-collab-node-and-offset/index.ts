import { Map as YMap, XmlElement, XmlText } from "yjs";

import { CollabCodeBlockNode } from "../../collaboration/nodes/code-block";
import { CollabDecoratorNode } from "../../collaboration/nodes/decorator";
import { CollabElementNode } from "../../collaboration/nodes/element";
import { CollabLineBreakNode } from "../../collaboration/nodes/line-break";
import { CollabTextNode } from "../../collaboration/nodes/text";
import { get_position_from_element_and_offset } from "../get-position-from-element-and-offset";

/**
 * Returns the collab node with offset
 * @param shared_type Shared type
 * @param offset Offset
 */
export const get_collab_node_and_offset = (
  shared_type: XmlElement | XmlText | YMap<unknown>,
  offset: number
): [
  (
    | null
    | CollabDecoratorNode
    | CollabElementNode
    | CollabTextNode
    | CollabLineBreakNode
    | CollabCodeBlockNode
  ),
  number
] => {
  const collab_node = shared_type._collab_node;

  if (collab_node === undefined) {
    return [null, 0];
  }

  if (collab_node instanceof CollabElementNode) {
    const { node, offset: collab_node_offset } =
      get_position_from_element_and_offset(collab_node, offset, true);

    if (node === null) {
      return [collab_node, 0];
    } else {
      return [node, collab_node_offset];
    }
  }

  return [null, 0];
};
