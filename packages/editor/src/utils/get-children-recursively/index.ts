import { $isElementNode, LexicalNode } from "lexical";

/**
 * Returns the children of a node by recursively collecting the children of all the child nodes
 * @param node Start node
 */
export const $getChildrenRecursively = (node: LexicalNode): LexicalNode[] => {
  const nodes: LexicalNode[] = [];
  const stack = [node];

  while (stack.length > 0) {
    const currentNode = stack.pop();

    if (currentNode === undefined) {
      throw new Error(`stack.length > 0; can't be undefined`);
    }

    if ($isElementNode(currentNode)) {
      stack.unshift(...currentNode.getChildren());
    }

    if (currentNode !== node) {
      nodes.push(currentNode);
    }
  }

  return nodes;
};
