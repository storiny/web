import {
  $getNodeByKey as $get_node_by_key,
  $getSelection as $get_selection,
  $isElementNode as $is_element_node,
  $isRangeSelection as $is_range_selection,
  $isTextNode as $is_text_node,
  NodeKey,
  Point
} from "lexical";
import { Map as YMap, XmlElement, XmlText } from "yjs";

import { Binding } from "../../collaboration/bindings";
import { Provider } from "../../collaboration/provider";
import { create_absolute_position } from "../create-absolute-position";
import { get_collab_node_and_offset } from "../get-collab-node-and-offset";

/**
 * Sets a point
 * @param point Point
 * @param key Node key
 * @param offset Offset
 */
const set_point = (point: Point, key: NodeKey, offset: number): void => {
  if (point.key !== key || point.offset !== offset) {
    let anchor_node = $get_node_by_key(key);

    if (
      anchor_node !== null &&
      !$is_element_node(anchor_node) &&
      !$is_text_node(anchor_node)
    ) {
      const parent = anchor_node.getParentOrThrow();
      key = parent.getKey();
      offset = anchor_node.getIndexWithinParent();
      anchor_node = parent;
    }

    point.set(key, offset, $is_element_node(anchor_node) ? "element" : "text");
  }
};

/**
 * Syncs the local cursor position
 * @param binding Binding
 * @param provider Provider
 */
export const sync_local_cursor_position = (
  binding: Binding,
  provider: Provider
): void => {
  const awareness = provider.awareness;
  const local_state = awareness.getLocalState();

  if (local_state === null) {
    return;
  }

  const anchor_pos = local_state.anchor_pos;
  const focus_pos = local_state.focus_pos;

  if (anchor_pos !== null && focus_pos !== null) {
    const anchor_abs_pos = create_absolute_position(anchor_pos, binding);
    const focus_abs_pos = create_absolute_position(focus_pos, binding);

    if (anchor_abs_pos !== null && focus_abs_pos !== null) {
      const [anchor_collab_node, anchor_offset] = get_collab_node_and_offset(
        anchor_abs_pos.type as XmlElement | XmlText | YMap<unknown>,
        anchor_abs_pos.index
      );
      const [focus_collab_node, focus_offset] = get_collab_node_and_offset(
        focus_abs_pos.type as XmlElement | XmlText | YMap<unknown>,
        focus_abs_pos.index
      );

      if (anchor_collab_node !== null && focus_collab_node !== null) {
        const anchor_key = anchor_collab_node.get_key();
        const focus_key = focus_collab_node.get_key();
        const selection = $get_selection();

        if (!$is_range_selection(selection)) {
          return;
        }

        const anchor = selection.anchor;
        const focus = selection.focus;

        set_point(anchor, anchor_key, anchor_offset);
        set_point(focus, focus_key, focus_offset);
      }
    }
  }
};
