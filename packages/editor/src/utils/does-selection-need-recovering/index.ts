import { $isTextNode, RangeSelection } from "lexical";

/**
 * Predicate function for determining whether the selection needs recovering
 * @param selection Selection
 */
export const doesSelectionNeedRecovering = (
  selection: RangeSelection
): boolean => {
  const anchor = selection.anchor;
  const focus = selection.focus;
  let recoveryNeeded = false;

  try {
    const anchorNode = anchor.getNode();
    const focusNode = focus.getNode();

    if (
      // We might have removed a node that no longer exists
      !anchorNode.isAttached() ||
      !focusNode.isAttached() ||
      // If we've split a node, then the offset might not be right
      ($isTextNode(anchorNode) &&
        anchor.offset > anchorNode.getTextContentSize()) ||
      ($isTextNode(focusNode) && focus.offset > focusNode.getTextContentSize())
    ) {
      recoveryNeeded = true;
    }
  } catch {
    // Sometimes checking for a node via `getNode` might trigger
    // an error, so we need recovery then too
    recoveryNeeded = true;
  }

  return recoveryNeeded;
};
