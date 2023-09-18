import { YjsNode } from "../../collaboration/provider";

/**
 * Returns the index of yjs node
 * @param yjsParentNode Yjs parent node
 * @param yjsNode Yjs node
 */
export const getIndexOfYjsNode = (
  yjsParentNode: YjsNode,
  yjsNode: YjsNode
): number => {
  let node = yjsParentNode.firstChild as YjsNode | null;
  let i = -1;

  if (node === null) {
    return -1;
  }

  do {
    i++;

    if (node === yjsNode) {
      return i;
    }

    // @ts-expect-error Sibling exists, but the type is not available from yjs
    node = node.nextSibling;

    if (node === null) {
      return -1;
    }
  } while ((node as unknown) !== null);

  return i;
};
