import {
  createDOMRange as create_dom_range,
  createRectsFromDOMRange as create_rects_from_dom_range
} from "@lexical/selection";
import { clsx } from "clsx";
import {
  $isLineBreakNode as $is_line_break_node,
  NodeKey,
  NodeMap
} from "lexical";
import { Map as YMap, XmlElement, XmlText } from "yjs";

import css from "~/theme/main.module.scss";

import { Binding } from "../../collaboration/bindings";
import { Provider } from "../../collaboration/provider";
import { create_absolute_position } from "../create-absolute-position";
import { get_collab_node_and_offset } from "../get-collab-node-and-offset";
import styles from "./styles.module.scss";

export interface CursorSelection {
  anchor: {
    key: NodeKey;
    offset: number;
  };
  caret: HTMLElement;
  color: string;
  focus: {
    key: NodeKey;
    offset: number;
  };
  selection_color: string;
  selections: Array<HTMLElement>;
}

export interface Cursor {
  color_bg: string;
  color_fg: string;
  name: string;
  selection: null | CursorSelection;
  selection_color: string;
  type: string;
}

/**
 * Creates a new cursor
 * @param props Cursor props
 */
const create_cursor = (
  props: Pick<
    Cursor,
    "color_bg" | "color_fg" | "selection_color" | "name" | "type"
  >
): Cursor => ({
  ...props,
  selection: null
});

/**
 * Destroys a selection
 * @param binding Binding
 * @param selection Selection
 */
const destroy_selection = (
  binding: Binding,
  selection: CursorSelection
): void => {
  const cursors_container = binding.cursors_container;

  if (cursors_container !== null) {
    const selections = selection.selections;
    const selections_length = selections.length;

    for (let i = 0; i < selections_length; i++) {
      cursors_container.removeChild(selections[i]);
    }
  }
};

/**
 * Destroys a cursor
 * @param binding Binding
 * @param cursor Cursor
 */
const destroy_cursor = (binding: Binding, cursor: Cursor): void => {
  const selection = cursor.selection;
  if (selection !== null) {
    destroy_selection(binding, selection);
  }
};

/**
 * Creates cursor selection
 * @param cursor Cursor
 * @param anchor_key Anchor key
 * @param anchor_offset Anchor offset
 * @param focus_key Focus key
 * @param focus_offset Focus offset
 */
const create_cursor_selection = (
  cursor: Cursor,
  anchor_key: NodeKey,
  anchor_offset: number,
  focus_key: NodeKey,
  focus_offset: number
): CursorSelection => {
  const caret = document.createElement("span");
  caret.className = styles.caret;
  caret.style.setProperty("--color-bg", cursor.color_bg);
  caret.style.setProperty("--color-fg", cursor.color_fg);

  if (cursor.type !== "mini") {
    const name = document.createElement("span");
    name.textContent = cursor.name;
    name.className = clsx(css.ellipsis, styles.name);

    caret.appendChild(name);
  } else {
    caret.classList.add(styles.mini);
  }

  return {
    anchor: {
      key: anchor_key,
      offset: anchor_offset
    },
    caret,
    color: cursor.color_bg,
    selection_color: cursor.selection_color,
    focus: {
      key: focus_key,
      offset: focus_offset
    },
    selections: []
  };
};

/**
 * Updates a cursor
 * @param binding Binding
 * @param cursor Cursor
 * @param next_selection Next selection
 * @param node_map Node map
 */
const update_cursor = (
  binding: Binding,
  cursor: Cursor,
  next_selection: null | CursorSelection,
  node_map: NodeMap
): void => {
  const editor = binding.editor;
  const root_element = editor.getRootElement();
  const cursors_container = binding.cursors_container;
  const cursors_container_offset_parent = cursors_container?.offsetParent;
  const editor_rect = document
    .querySelector("div[data-editor-content]")
    ?.getBoundingClientRect();

  if (
    cursors_container === null ||
    root_element === null ||
    !cursors_container_offset_parent
  ) {
    return;
  }

  const container_rect =
    cursors_container_offset_parent.getBoundingClientRect();
  const prev_selection = cursor.selection;

  if (next_selection === null) {
    if (prev_selection === null) {
      return;
    }

    cursor.selection = null;
    destroy_selection(binding, prev_selection);
    return;
  }

  cursor.selection = next_selection;

  const caret = next_selection.caret;
  const selection_color = next_selection.selection_color;
  const selections = next_selection.selections;
  const anchor = next_selection.anchor;
  const focus = next_selection.focus;
  const presence_child = caret.firstChild as HTMLSpanElement;
  const anchor_key = anchor.key;
  const focus_key = focus.key;
  const anchor_node = node_map.get(anchor_key);
  const focus_node = node_map.get(focus_key);

  if (anchor_node == null || focus_node == null) {
    return;
  }

  let selection_rects: Array<DOMRect>;

  // In the case of a collapsed selection on a linebreak, we need to improvise
  // as the browser will return nothing here as <br> apparantly takes up no
  // visual space. This won't work in all cases, but it's better than just
  // showing nothing all the time.
  if (anchor_node === focus_node && $is_line_break_node(anchor_node)) {
    const br_rect = (
      editor.getElementByKey(anchor_key) as HTMLElement
    ).getBoundingClientRect();
    selection_rects = [br_rect];
  } else {
    const range = create_dom_range(
      editor,
      anchor_node,
      anchor.offset,
      focus_node,
      focus.offset
    );

    if (range === null) {
      return;
    }

    selection_rects = create_rects_from_dom_range(editor, range);
  }

  const selections_length = selections.length;
  const selection_rects_length = selection_rects.length;

  for (let i = 0; i < selection_rects_length; i++) {
    const selection_rect = selection_rects[i];
    let selection = selections[i];

    if (selection === undefined) {
      selection = document.createElement("span");
      selections[i] = selection;
      selection.className = styles.selection;

      const selection_bg = document.createElement("span");
      selection_bg.className = styles["selection-bg"];
      selection_bg.style.backgroundColor = selection_color;

      selection.appendChild(selection_bg);
      cursors_container.appendChild(selection);
    }

    const top = selection_rect.top - container_rect.top;
    const left = selection_rect.left - container_rect.left;

    selection.style.top = `${top}px`;
    selection.style.left = `${left}px`;
    selection.style.height = `${selection_rect.height}px`;
    selection.style.width = `${selection_rect.width}px`;

    if (i === selection_rects_length - 1) {
      if (presence_child && editor_rect) {
        const presence_rect = presence_child.getBoundingClientRect();

        // Flip horizontally
        if (
          presence_rect.right +
            (presence_child.classList.contains(styles.flipped)
              ? presence_rect.width + 3
              : 0) >=
          editor_rect.right
        ) {
          presence_child.classList.add(styles.flipped);
        } else {
          presence_child.classList.remove(styles.flipped);
        }
      }

      if (caret.parentNode !== selection) {
        selection.appendChild(caret);
      }
    }
  }

  for (let i = selections_length - 1; i >= selection_rects_length; i--) {
    const selection = selections[i];
    cursors_container.removeChild(selection);
    selections.pop();
  }
};

/**
 * Syncs cursor positions
 * @param binding Binding
 * @param provider Provider
 */
export const sync_cursor_positions = (
  binding: Binding,
  provider: Provider
): void => {
  const awareness_states = Array.from(provider.awareness.getStates()).filter(
    (peer) => peer.role !== "viewer"
  );
  const local_client_id = binding.client_id;
  const cursors = binding.cursors;
  const editor = binding.editor;
  const node_map = editor._editorState._nodeMap;
  const visited_client_ids = new Set();
  const [, local_state] =
    awareness_states.find(([client_id]) => client_id === local_client_id) || [];
  const cursor_type = local_state?.cursor_type;

  for (let i = 0; i < awareness_states.length; i++) {
    const awareness_state = awareness_states[i];
    const [client_id, awareness] = awareness_state;

    if (client_id !== local_client_id) {
      visited_client_ids.add(client_id);

      const {
        anchor_pos,
        focus_pos,
        name,
        color_bg,
        color_fg,
        selection_color,
        focusing
      } = awareness;
      let selection = null;
      let cursor = cursors.get(client_id);

      if (cursor === undefined || cursor.type !== cursor_type) {
        if (cursor !== undefined) {
          destroy_cursor(binding, cursor);
          cursors.delete(client_id);
        }

        cursor = create_cursor({
          name,
          color_bg,
          color_fg,
          selection_color,
          type: cursor_type
        });

        cursors.set(client_id, cursor);
      }

      if (anchor_pos !== null && focus_pos !== null && focusing) {
        const anchor_abs_pos = create_absolute_position(anchor_pos, binding);
        const focus_abs_pos = create_absolute_position(focus_pos, binding);

        if (anchor_abs_pos !== null && focus_abs_pos !== null) {
          const [anchor_collab_node, anchor_offset] =
            get_collab_node_and_offset(
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
            selection = cursor.selection;

            if (selection === null) {
              selection = create_cursor_selection(
                cursor,
                anchor_key,
                anchor_offset,
                focus_key,
                focus_offset
              );
            } else {
              const anchor = selection.anchor;
              const focus = selection.focus;
              anchor.key = anchor_key;
              anchor.offset = anchor_offset;
              focus.key = focus_key;
              focus.offset = focus_offset;
            }
          }
        }
      }

      update_cursor(binding, cursor, selection, node_map);
    }
  }

  const all_client_ids = Array.from(cursors.keys());

  for (let i = 0; i < all_client_ids.length; i++) {
    const client_id = all_client_ids[i];

    if (!visited_client_ids.has(client_id)) {
      const cursor = cursors.get(client_id);

      if (cursor !== undefined) {
        destroy_cursor(binding, cursor);
        cursors.delete(client_id);
      }
    }
  }
};
