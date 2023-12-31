import { $isTextNode as $is_text_node, RangeSelection } from "lexical";

/**
 * Predicate function for determining whether the selection needs recovering
 * @param selection Selection
 */
export const does_selection_need_recovering = (
  selection: RangeSelection
): boolean => {
  const anchor = selection.anchor;
  const focus = selection.focus;
  let recovery_needed = false;

  try {
    const anchor_node = anchor.getNode();
    const focus_node = focus.getNode();

    if (
      // We might have removed a node that no longer exists
      !anchor_node.isAttached() ||
      !focus_node.isAttached() ||
      // If we've split a node, then the offset might not be right
      ($is_text_node(anchor_node) &&
        anchor.offset > anchor_node.getTextContentSize()) ||
      ($is_text_node(focus_node) &&
        focus.offset > focus_node.getTextContentSize())
    ) {
      recovery_needed = true;
    }
  } catch {
    // Sometimes checking for a node via `getNode` might trigger an error, so
    // we need recovery then too
    recovery_needed = true;
  }

  return recovery_needed;
};
