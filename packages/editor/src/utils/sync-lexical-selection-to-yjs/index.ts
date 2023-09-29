import {
  $isRangeSelection as $is_range_selection,
  $isTextNode as $is_text_node,
  GridSelection,
  NodeSelection,
  Point,
  RangeSelection
} from "lexical";
import {
  compareRelativePositions as compare_relative_positions,
  createRelativePositionFromTypeIndex as create_relative_position_from_type_index,
  RelativePosition
} from "yjs";

import { Binding } from "../../collaboration/bindings";
import { CollabElementNode } from "../../collaboration/nodes/element";
import { CollabTextNode } from "../../collaboration/nodes/text";
import { Provider } from "../../collaboration/provider";

/**
 * Creates relative position using a point
 * @param point Point
 * @param binding Binding
 */
const create_relative_position = (
  point: Point,
  binding: Binding
): null | RelativePosition => {
  const collab_node_map = binding.collab_node_map;
  const collab_node = collab_node_map.get(point.key);

  if (collab_node === undefined) {
    return null;
  }

  let offset = point.offset;
  let shared_type = collab_node.get_shared_type();

  if (collab_node instanceof CollabTextNode) {
    shared_type = collab_node._parent._xml_text;
    const current_offset = collab_node.get_offset();

    if (current_offset === -1) {
      return null;
    }

    offset = current_offset + 1 + offset;
  } else if (
    collab_node instanceof CollabElementNode &&
    point.type === "element"
  ) {
    const parent = point.getNode();
    let accumulated_offset = 0;
    let i = 0;
    let node = parent.getFirstChild();

    while (node !== null && i++ < offset) {
      if ($is_text_node(node)) {
        accumulated_offset += node.getTextContentSize() + 1;
      } else {
        accumulated_offset++;
      }

      node = node.getNextSibling();
    }

    offset = accumulated_offset;
  }

  return create_relative_position_from_type_index(shared_type, offset);
};

/**
 * Predicate function for determining whether the position needs to be
 * updated
 * @param current_pos Current position
 * @param pos Position
 */
const should_update_position = (
  current_pos: RelativePosition | null | undefined,
  pos: RelativePosition | null | undefined
): boolean => {
  if (current_pos == null) {
    if (pos != null) {
      return true;
    }
  } else if (pos == null || !compare_relative_positions(current_pos, pos)) {
    return true;
  }

  return false;
};

/**
 * Syncs lexical selection to yjs
 * @param binding Binding
 * @param provider Provider
 * @param prev_selection Previous selection
 * @param next_selection Next selection
 */
export const sync_lexical_selection_to_yjs = (
  binding: Binding,
  provider: Provider,
  prev_selection: null | RangeSelection | NodeSelection | GridSelection,
  next_selection: null | RangeSelection | NodeSelection | GridSelection
): void => {
  const awareness = provider.awareness;
  const local_state = awareness.getLocalState();

  if (local_state === null) {
    return;
  }

  const {
    anchor_pos: current_anchor_pos,
    focus_pos: current_focus_pos,
    focusing,
    awareness_data,
    ...rest
  } = local_state;
  let anchor_pos = null;
  let focus_pos = null;

  if (
    next_selection === null ||
    (current_anchor_pos !== null && !next_selection.is(prev_selection))
  ) {
    if (prev_selection === null) {
      return;
    }
  }

  if ($is_range_selection(next_selection)) {
    anchor_pos = create_relative_position(next_selection.anchor, binding);
    focus_pos = create_relative_position(next_selection.focus, binding);
  }

  if (
    should_update_position(current_anchor_pos, anchor_pos) ||
    should_update_position(current_focus_pos, focus_pos)
  ) {
    awareness.setLocalState({
      anchor_pos,
      awareness_data,
      focus_pos,
      focusing,
      ...rest
    });
  }
};
