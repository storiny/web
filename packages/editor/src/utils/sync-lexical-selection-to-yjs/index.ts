import {
  $isRangeSelection,
  $isTextNode,
  GridSelection,
  NodeSelection,
  Point,
  RangeSelection
} from "lexical";
import {
  compareRelativePositions,
  createRelativePositionFromTypeIndex,
  RelativePosition
} from "yjs";

import { Binding } from "../../collab/bindings";
import { CollabElementNode } from "../../collab/nodes/element";
import { CollabTextNode } from "../../collab/nodes/text";
import { Provider } from "../../collab/provider";

/**
 * Creates relative position using a point
 * @param point Point
 * @param binding Binding
 */
const createRelativePosition = (
  point: Point,
  binding: Binding
): null | RelativePosition => {
  const collabNodeMap = binding.collabNodeMap;
  const collabNode = collabNodeMap.get(point.key);

  if (collabNode === undefined) {
    return null;
  }

  let offset = point.offset;
  let sharedType = collabNode.getSharedType();

  if (collabNode instanceof CollabTextNode) {
    sharedType = collabNode._parent._xmlText;
    const currentOffset = collabNode.getOffset();

    if (currentOffset === -1) {
      return null;
    }

    offset = currentOffset + 1 + offset;
  } else if (
    collabNode instanceof CollabElementNode &&
    point.type === "element"
  ) {
    const parent = point.getNode();
    let accumulatedOffset = 0;
    let i = 0;
    let node = parent.getFirstChild();

    while (node !== null && i++ < offset) {
      if ($isTextNode(node)) {
        accumulatedOffset += node.getTextContentSize() + 1;
      } else {
        accumulatedOffset++;
      }

      node = node.getNextSibling();
    }

    offset = accumulatedOffset;
  }

  return createRelativePositionFromTypeIndex(sharedType, offset);
};

/**
 * Predicate function for determining whether the position needs to be
 * updated
 * @param currentPos Current position
 * @param pos Position
 */
const shouldUpdatePosition = (
  currentPos: RelativePosition | null | undefined,
  pos: RelativePosition | null | undefined
): boolean => {
  if (currentPos == null) {
    if (pos != null) {
      return true;
    }
  } else if (pos == null || !compareRelativePositions(currentPos, pos)) {
    return true;
  }

  return false;
};

/**
 * Syncs lexical selection to yjs
 * @param binding Binding
 * @param provider Provider
 * @param prevSelection Previous selection
 * @param nextSelection Next selection
 */
export const syncLexicalSelectionToYjs = (
  binding: Binding,
  provider: Provider,
  prevSelection: null | RangeSelection | NodeSelection | GridSelection,
  nextSelection: null | RangeSelection | NodeSelection | GridSelection
): void => {
  const awareness = provider.awareness;
  const localState = awareness.getLocalState();

  if (localState === null) {
    return;
  }

  const {
    anchorPos: currentAnchorPos,
    focusPos: currentFocusPos,
    name,
    color,
    avatarId,
    avatarHex,
    focusing,
    awarenessData
  } = localState;
  let anchorPos = null;
  let focusPos = null;

  if (
    nextSelection === null ||
    (currentAnchorPos !== null && !nextSelection.is(prevSelection))
  ) {
    if (prevSelection === null) {
      return;
    }
  }

  if ($isRangeSelection(nextSelection)) {
    anchorPos = createRelativePosition(nextSelection.anchor, binding);
    focusPos = createRelativePosition(nextSelection.focus, binding);
  }

  if (
    shouldUpdatePosition(currentAnchorPos, anchorPos) ||
    shouldUpdatePosition(currentFocusPos, focusPos)
  ) {
    awareness.setLocalState({
      avatarId,
      avatarHex,
      anchorPos,
      awarenessData,
      color,
      focusPos,
      focusing,
      name
    });
  }
};
