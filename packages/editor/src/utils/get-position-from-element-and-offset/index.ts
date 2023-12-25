import { CollabCodeBlockNode } from "../../collaboration/nodes/code-block";
import { CollabDecoratorNode } from "../../collaboration/nodes/decorator";
import { CollabElementNode } from "../../collaboration/nodes/element";
import { CollabLineBreakNode } from "../../collaboration/nodes/line-break";
import { CollabTextNode } from "../../collaboration/nodes/text";

/**
 * Returns the position from element and offset
 * @param node Collab node
 * @param offset Offset
 * @param boundary_is_edge Whether to treat boundary as edge
 */
export const get_position_from_element_and_offset = (
  node: CollabElementNode,
  offset: number,
  boundary_is_edge: boolean
): {
  length: number;
  node:
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
    | CollabCodeBlockNode
    | null;
  node_index: number;
  offset: number;
} => {
  let index = 0;
  let i = 0;
  const children = node._children;
  const children_length = children.length;

  for (; i < children_length; i++) {
    const child = children[i];
    const child_offset = index;
    const size = child.get_size();

    index += size;

    const exceeds_boundary = boundary_is_edge
      ? index >= offset
      : index > offset;

    if (exceeds_boundary && child instanceof CollabTextNode) {
      let text_offset = offset - child_offset - 1;

      if (text_offset < 0) {
        text_offset = 0;
      }

      const diff_length = index - offset;

      return {
        length: diff_length,
        node: child,
        node_index: i,
        offset: text_offset
      };
    }

    if (index > offset) {
      return {
        length: 0,
        node: child,
        node_index: i,
        offset: child_offset
      };
    } else if (i === children_length - 1) {
      return {
        length: 0,
        node: null,
        node_index: i + 1,
        offset: child_offset + 1
      };
    }
  }

  return {
    length: 0,
    node: null,
    node_index: 0,
    offset: 0
  };
};
