import { CollabDecoratorNode } from "../../collaboration/nodes/decorator";
import { CollabElementNode } from "../../collaboration/nodes/element";
import { CollabLineBreakNode } from "../../collaboration/nodes/line-break";
import { CollabTextNode } from "../../collaboration/nodes/text";

/**
 * Returns the position from element and offset
 * @param node Collab node
 * @param offset Offset
 * @param boundaryIsEdge Whether to treat boundary as edge
 */
export const getPositionFromElementAndOffset = (
  node: CollabElementNode,
  offset: number,
  boundaryIsEdge: boolean
): {
  length: number;
  node:
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
    | null;
  nodeIndex: number;
  offset: number;
} => {
  let index = 0;
  let i = 0;
  const children = node._children;
  const childrenLength = children.length;

  for (; i < childrenLength; i++) {
    const child = children[i];
    const childOffset = index;
    const size = child.getSize();

    index += size;

    const exceedsBoundary = boundaryIsEdge ? index >= offset : index > offset;

    if (exceedsBoundary && child instanceof CollabTextNode) {
      let textOffset = offset - childOffset - 1;

      if (textOffset < 0) {
        textOffset = 0;
      }

      const diffLength = index - offset;

      return {
        length: diffLength,
        node: child,
        nodeIndex: i,
        offset: textOffset
      };
    }

    if (index > offset) {
      return {
        length: 0,
        node: child,
        nodeIndex: i,
        offset: childOffset
      };
    } else if (i === childrenLength - 1) {
      return {
        length: 0,
        node: null,
        nodeIndex: i + 1,
        offset: childOffset + 1
      };
    }
  }

  return {
    length: 0,
    node: null,
    nodeIndex: 0,
    offset: 0
  };
};
