import { CollabDecoratorNode } from "../../collab/nodes/decorator";
import { CollabElementNode } from "../../collab/nodes/element";
import { CollabLineBreakNode } from "../../collab/nodes/line-break";
import { CollabTextNode } from "../../collab/nodes/text";
import { getPositionFromElementAndOffset } from "../get-position-from-element-and-offset";

/**
 * Returns the collab node with offset
 * @param sharedType Shared type
 * @param offset Offset
 */
export const getCollabNodeAndOffset = (
  sharedType: any,
  offset: number
): [
  (
    | null
    | CollabDecoratorNode
    | CollabElementNode
    | CollabTextNode
    | CollabLineBreakNode
  ),
  number
] => {
  const collabNode = sharedType._collabNode;

  if (collabNode === undefined) {
    return [null, 0];
  }

  if (collabNode instanceof CollabElementNode) {
    const { node, offset: collabNodeOffset } = getPositionFromElementAndOffset(
      collabNode,
      offset,
      true
    );

    if (node === null) {
      return [collabNode, 0];
    } else {
      return [node, collabNodeOffset];
    }
  }

  return [null, 0];
};
