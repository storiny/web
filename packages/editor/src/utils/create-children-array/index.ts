import { $getNodeByKey, ElementNode, NodeKey, NodeMap } from "lexical";

/**
 * Creates a children array
 * @param element Element node
 * @param nodeMap Node map
 */
export const createChildrenArray = (
  element: ElementNode,
  nodeMap: null | NodeMap
): Array<NodeKey> => {
  const children: NodeKey[] = [];
  let nodeKey = element.__first;

  while (nodeKey !== null) {
    const node =
      nodeMap === null ? $getNodeByKey(nodeKey) : nodeMap.get(nodeKey);
    if (node === null || node === undefined) {
      throw new Error("`createChildrenArray`: node does not exist in nodeMap");
    }

    children.push(nodeKey);
    nodeKey = node.__next;
  }

  return children;
};
