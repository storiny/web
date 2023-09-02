import { $getNodeByKey, LexicalNode, NodeKey } from "lexical";

/**
 * Returns the node by node key
 * @param key Node key
 */
export const $getNodeByKeyOrThrow = (key: NodeKey): LexicalNode => {
  const node = $getNodeByKey(key);

  if (node === null) {
    throw new Error("Unable to find the node by key");
  }

  return node;
};
