import { $isElementNode as $is_element_node, LexicalNode } from "lexical";

/**
 * Returns the children of a node by recursively collecting the children of all the child nodes
 * @param node Start node
 */
export const $get_children_recursively = (node: LexicalNode): LexicalNode[] => {
  const nodes: LexicalNode[] = [];
  const stack = [node];

  while (stack.length > 0) {
    const current_node = stack.pop();

    if (current_node === undefined) {
      throw new Error(`stack.length > 0; can't be undefined`);
    }

    if ($is_element_node(current_node)) {
      stack.unshift(...current_node.getChildren());
    }

    if (current_node !== node) {
      nodes.push(current_node);
    }
  }

  return nodes;
};
