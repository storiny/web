import {
  $getNodeByKey as $get_node_by_key,
  ElementNode,
  NodeKey,
  NodeMap
} from "lexical";

/**
 * Creates a children array
 * @param element Element node
 * @param node_map Node map
 */
export const create_children_array = (
  element: ElementNode,
  node_map: null | NodeMap
): Array<NodeKey> => {
  const children: NodeKey[] = [];
  let node_key = element.__first;

  while (node_key !== null) {
    const node =
      node_map === null ? $get_node_by_key(node_key) : node_map.get(node_key);

    if (node === null || node === undefined) {
      throw new Error(
        "`create_children_array`: node does not exist in nodeMap"
      );
    }

    children.push(node_key);
    node_key = node.__next;
  }

  return children;
};
