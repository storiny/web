import { $isAtNodeEnd as $is_node_at_end } from "@lexical/selection";
import { ElementNode, RangeSelection, TextNode } from "lexical";

/**
 * Returns the selected node
 * @param selection Selection
 */
export const get_selected_node = (
  selection: RangeSelection
): TextNode | ElementNode => {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchor_node = selection.anchor.getNode();
  const focus_node = selection.focus.getNode();

  if (anchor_node === focus_node) {
    return anchor_node;
  }

  if (selection.isBackward()) {
    return $is_node_at_end(focus) ? anchor_node : focus_node;
  }

  return $is_node_at_end(anchor) ? anchor_node : focus_node;
};
