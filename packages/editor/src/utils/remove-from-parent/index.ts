import { LexicalNode } from "lexical";

/**
 * Removes a node from its parent
 * @param node Node
 */
export const remove_from_parent = (node: LexicalNode): void => {
  const old_parent = node.getParent();

  if (old_parent !== null) {
    const writable_node = node.getWritable();
    const writable_parent = old_parent.getWritable();
    const prev_sibling = node.getPreviousSibling();
    const next_sibling = node.getNextSibling();

    // TODO: This function duplicates a bunch of operations, can be simplified
    if (prev_sibling === null) {
      if (next_sibling !== null) {
        const writable_next_sibling = next_sibling.getWritable();
        writable_parent.__first = next_sibling.__key;
        writable_next_sibling.__prev = null;
      } else {
        writable_parent.__first = null;
      }
    } else {
      const writable_prev_sibling = prev_sibling.getWritable();

      if (next_sibling !== null) {
        const writable_next_sibling = next_sibling.getWritable();
        writable_next_sibling.__prev = writable_prev_sibling.__key;
        writable_prev_sibling.__next = writable_next_sibling.__key;
      } else {
        writable_prev_sibling.__next = null;
      }

      writable_node.__prev = null;
    }
    if (next_sibling === null) {
      if (prev_sibling !== null) {
        const writable_prev_sibling = prev_sibling.getWritable();
        writable_parent.__last = prev_sibling.__key;
        writable_prev_sibling.__next = null;
      } else {
        writable_parent.__last = null;
      }
    } else {
      const writable_next_sibling = next_sibling.getWritable();

      if (prev_sibling !== null) {
        const writable_prev_sibling = prev_sibling.getWritable();
        writable_prev_sibling.__next = writable_next_sibling.__key;
        writable_next_sibling.__prev = writable_prev_sibling.__key;
      } else {
        writable_next_sibling.__prev = null;
      }

      writable_node.__next = null;
    }

    writable_parent.__size--;
    writable_node.__parent = null;
  }
};
