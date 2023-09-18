import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  NodeKey,
  Point
} from "lexical";

import { Binding } from "../../collaboration/bindings";
import { Provider } from "../../collaboration/provider";
import { createAbsolutePosition } from "../create-absolute-position";
import { getCollabNodeAndOffset } from "../get-collab-node-and-offset";

/**
 * Sets a point
 * @param point Point
 * @param key Node key
 * @param offset Offset
 */
const setPoint = (point: Point, key: NodeKey, offset: number): void => {
  if (point.key !== key || point.offset !== offset) {
    let anchorNode = $getNodeByKey(key);

    if (
      anchorNode !== null &&
      !$isElementNode(anchorNode) &&
      !$isTextNode(anchorNode)
    ) {
      const parent = anchorNode.getParentOrThrow();
      key = parent.getKey();
      offset = anchorNode.getIndexWithinParent();
      anchorNode = parent;
    }

    point.set(key, offset, $isElementNode(anchorNode) ? "element" : "text");
  }
};

/**
 * Syncs the local cursor position
 * @param binding Binding
 * @param provider Provider
 */
export const syncLocalCursorPosition = (
  binding: Binding,
  provider: Provider
): void => {
  const awareness = provider.awareness;
  const localState = awareness.getLocalState();

  if (localState === null) {
    return;
  }

  const anchorPos = localState.anchorPos;
  const focusPos = localState.focusPos;

  if (anchorPos !== null && focusPos !== null) {
    const anchorAbsPos = createAbsolutePosition(anchorPos, binding);
    const focusAbsPos = createAbsolutePosition(focusPos, binding);

    if (anchorAbsPos !== null && focusAbsPos !== null) {
      const [anchorCollabNode, anchorOffset] = getCollabNodeAndOffset(
        anchorAbsPos.type,
        anchorAbsPos.index
      );
      const [focusCollabNode, focusOffset] = getCollabNodeAndOffset(
        focusAbsPos.type,
        focusAbsPos.index
      );

      if (anchorCollabNode !== null && focusCollabNode !== null) {
        const anchorKey = anchorCollabNode.getKey();
        const focusKey = focusCollabNode.getKey();
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return;
        }

        const anchor = selection.anchor;
        const focus = selection.focus;

        setPoint(anchor, anchorKey, anchorOffset);
        setPoint(focus, focusKey, focusOffset);
      }
    }
  }
};
