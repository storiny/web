"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $getNearestNodeFromDOMNode as $get_nearest_node_from_dom_node,
  $getNodeByKey as $get_node_by_key,
  $getRoot as $get_root,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  LexicalEditor
} from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import { use_media_query } from "~/hooks/use-media-query";
import GripIcon from "~/icons/grip";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import { is_html_element } from "../../utils/is-html-element";
import { Point } from "../../utils/point";
import { Rect } from "../../utils/rect";
import { event_files } from "../rich-text";
import styles from "./draggable-block.module.scss";

const HORIZONTAL_OFFSET = 4;
const TARGET_LINE_HALF_HEIGHT = 2.5;
const DRAG_DATA_FORMAT = "application/x-storiny-drag-data";
const TEXT_BOX_HORIZONTAL_PADDING = 28;

enum Direction {
  DOWNWARD /*     */ = 1,
  INDETERMINATE /**/ = 0,
  UPWARD /*       */ = -1
}

let prev_index = Infinity;

/**
 * Returns the current index.
 * @param keys_length Length of keys
 */
const get_current_index = (keys_length: number): number => {
  if (keys_length === 0) {
    return Infinity;
  }

  if (prev_index >= 0 && prev_index < keys_length) {
    return prev_index;
  }

  return Math.floor(keys_length / 2);
};

/**
 * Returns the keys of the top level nodes.
 * @param editor The editor instance
 */
const get_top_level_node_keys = (editor: LexicalEditor): string[] =>
  editor.getEditorState().read(() => $get_root().getChildrenKeys());

/**
 * Returns the margin for the given element.
 * @param element The target element
 * @param margin The margin direction
 */
const get_margin = (
  element: Element | null,
  margin: "marginTop" | "marginBottom"
): number =>
  element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

/**
 * Returns the collapsed margins for the provided element.
 * @param element The target element.
 */
const get_collapsed_margins = (
  element: HTMLElement
): {
  margin_bottom: number;
  margin_top: number;
} => {
  const { marginTop: margin_top, marginBottom: margin_bottom } =
    window.getComputedStyle(element);
  const prev_elem_sibling_margin_bottom = get_margin(
    element.previousElementSibling,
    "marginBottom"
  );
  const next_elem_sibling_margin_top = get_margin(
    element.nextElementSibling,
    "marginTop"
  );
  const collapsed_top_margin = Math.max(
    parseFloat(margin_top),
    prev_elem_sibling_margin_bottom
  );
  const collapsed_bottom_margin = Math.max(
    parseFloat(margin_bottom),
    next_elem_sibling_margin_top
  );

  return {
    margin_bottom: collapsed_bottom_margin,
    margin_top: collapsed_top_margin
  };
};

/**
 * Returns the block element at the mouse position.
 * @param anchor_element The anchor element
 * @param editor The editor instance
 * @param event The mouse event
 * @param use_edge_as_default Whether to use the first and last nodes as default
 */
const get_block_element = (
  anchor_element: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  use_edge_as_default = false
): HTMLElement | null => {
  const anchor_element_rect = anchor_element.getBoundingClientRect();
  const top_level_node_keys = get_top_level_node_keys(editor);
  let block_element: HTMLElement | null = null;

  editor.getEditorState().read(() => {
    if (use_edge_as_default) {
      const [first_node, last_node] = [
        editor.getElementByKey(top_level_node_keys[0]),
        editor.getElementByKey(
          top_level_node_keys[top_level_node_keys.length - 1]
        )
      ];

      const [first_node_rect, last_node_rect] = [
        first_node?.getBoundingClientRect(),
        last_node?.getBoundingClientRect()
      ];

      if (first_node_rect && last_node_rect) {
        if (event.y < first_node_rect.top) {
          block_element = first_node;
        } else if (event.y > last_node_rect.bottom) {
          block_element = last_node;
        }

        if (block_element) {
          return;
        }
      }
    }

    let index = get_current_index(top_level_node_keys.length);
    let direction = Direction.INDETERMINATE;

    while (index >= 0 && index < top_level_node_keys.length) {
      const key = top_level_node_keys[index];
      const element = editor.getElementByKey(key);

      if (element === null) {
        break;
      }

      const point = new Point(event.x, event.y);
      const dom_rect = Rect.from_dom(element);
      const { margin_top, margin_bottom } = get_collapsed_margins(element);
      const rect = dom_rect.generate_new_rect({
        bottom: dom_rect.bottom + margin_bottom,
        left: anchor_element_rect.left,
        right: anchor_element_rect.right,
        top: dom_rect.top - margin_top
      });
      const {
        result,
        reason: { is_on_top_side, is_on_bottom_side }
      } = rect.contains(point);

      if (result) {
        block_element = element;
        prev_index = index;
        break;
      }

      if (direction === Direction.INDETERMINATE) {
        if (is_on_top_side) {
          direction = Direction.UPWARD;
        } else if (is_on_bottom_side) {
          direction = Direction.DOWNWARD;
        } else {
          // Stop searching the block element.
          direction = Infinity;
        }
      }

      index += direction;
    }
  });

  return block_element;
};

/**
 * Predicate function to determine whether the provied element is contained within the dragger.
 * @param element The target element
 */
const is_on_dragger = (element: HTMLElement): boolean =>
  !!element.closest(`.${styles.dragger}`);

/**
 * Predicate function for determining non-inline nodes.
 * @param target_element The target element
 */
const is_block_node = (target_element: HTMLElement): boolean =>
  (target_element.getAttribute("data-lexical-decorator") === "true" &&
    target_element.nodeName.toLowerCase() !== "hr") ||
  target_element.nodeName.toLowerCase() === "figure";

/**
 * Sets the dragger's position.
 * @param target_element The target element
 * @param floating_element The floating element
 * @param anchor_element The anchor element
 */
const set_dragger_position = (
  target_element: HTMLElement | null,
  floating_element: HTMLElement,
  anchor_element: HTMLElement
): void => {
  if (!target_element) {
    floating_element.style.opacity = "0";
    return;
  }

  const target_rect = target_element.getBoundingClientRect();
  const target_style = window.getComputedStyle(target_element);
  const floating_element_rect = floating_element.getBoundingClientRect();
  const anchor_element_rect = anchor_element.getBoundingClientRect();
  const top =
    target_rect.top +
    (parseInt(target_style.lineHeight, 10) - floating_element_rect.height) / 2 -
    anchor_element_rect.top -
    (is_block_node(target_element) ? floating_element_rect.height + 12 : 0);
  const left = HORIZONTAL_OFFSET;

  floating_element.style.opacity = "1";
  floating_element.style.transform = `translate(${left}px, ${top}px)`;
};

/**
 * Sets the drag image.
 * @param data_transfer The data transfer object
 * @param draggable_block_element The draggable block element
 */
const set_drag_image = (
  data_transfer: DataTransfer,
  draggable_block_element: HTMLElement
): void => {
  const { transform } = draggable_block_element.style;

  // Remove drag image borders.
  draggable_block_element.style.transform = "translateZ(0)";
  data_transfer.setDragImage(
    draggable_block_element,
    // Center the block nodes
    is_block_node(draggable_block_element)
      ? draggable_block_element.offsetWidth
      : 0,
    0
  );

  setTimeout(() => {
    draggable_block_element.style.transform = transform;
  });
};

/**
 * Sets the target line.
 * @param target_line_element The target line element
 * @param target_block_element The target block element
 * @param mouse_y Mouse Y coordinate
 * @param anchor_element The anchor element
 */
const set_target_line = (
  target_line_element: HTMLElement,
  target_block_element: HTMLElement,
  mouse_y: number,
  anchor_element: HTMLElement
): void => {
  const { top: target_block_element_top, height: target_block_element_height } =
    target_block_element.getBoundingClientRect();
  const { top: anchor_top, width: anchor_width } =
    anchor_element.getBoundingClientRect();
  const { margin_top, margin_bottom } =
    get_collapsed_margins(target_block_element);

  let line_top = target_block_element_top;

  if (mouse_y >= target_block_element_top) {
    line_top += target_block_element_height + margin_bottom / 2;
  } else {
    line_top -= margin_top / 2;
  }

  const top = line_top - anchor_top - TARGET_LINE_HALF_HEIGHT;
  const left = TEXT_BOX_HORIZONTAL_PADDING - HORIZONTAL_OFFSET;

  target_line_element.style.transform = `translate(${left}px, ${top}px)`;
  target_line_element.style.width = `${
    anchor_width - (TEXT_BOX_HORIZONTAL_PADDING - HORIZONTAL_OFFSET) * 2
  }px`;
  target_line_element.style.opacity = "0.5";
};

/**
 * Hides the target line.
 * @param target_line_element The target line element.
 */
const hide_target_line = (target_line_element: HTMLElement | null): void => {
  if (target_line_element) {
    target_line_element.style.opacity = "0";
  }
};

const DraggableBlockPlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();
  const is_editable = editor._editable;
  const anchor_element = document.querySelector("div[data-editor-content]")
    ?.parentElement as HTMLDivElement | null;
  const scroller_element = anchor_element?.parentElement;
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const dragger_ref = React.useRef<HTMLDivElement>(null);
  const target_line_ref = React.useRef<HTMLDivElement>(null);
  const is_dragging_block_ref = React.useRef<boolean>(false);
  const [draggable_block_element, set_draggable_block_element] =
    React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const on_mouse_move = (event: MouseEvent): void => {
      const target = event.target;

      if (!anchor_element || !is_html_element(target)) {
        set_draggable_block_element(null);
        return;
      }

      if (is_on_dragger(target)) {
        return;
      }

      set_draggable_block_element(
        get_block_element(anchor_element, editor, event)
      );
    };

    const on_mouse_leave = (): void => {
      set_draggable_block_element(null);
    };

    scroller_element?.addEventListener("mousemove", on_mouse_move);
    scroller_element?.addEventListener("mouseleave", on_mouse_leave);

    return () => {
      scroller_element?.removeEventListener("mousemove", on_mouse_move);
      scroller_element?.removeEventListener("mouseleave", on_mouse_leave);
    };
  }, [scroller_element, anchor_element, editor]);

  React.useEffect(() => {
    if (anchor_element && dragger_ref.current) {
      set_dragger_position(
        draggable_block_element,
        dragger_ref.current,
        anchor_element
      );
    }
  }, [anchor_element, draggable_block_element]);

  React.useEffect(() => {
    const on_dragover = (event: DragEvent): boolean => {
      if (!anchor_element || !is_dragging_block_ref.current) {
        return false;
      }

      const [is_file_transfer] = event_files(event);

      if (is_file_transfer) {
        return false;
      }

      const { pageY: page_y, target } = event;

      if (!is_html_element(target)) {
        return false;
      }

      const target_block_element = get_block_element(
        anchor_element,
        editor,
        event,
        true
      );
      const target_line_element = target_line_ref.current;

      if (target_block_element === null || target_line_element === null) {
        return false;
      }

      set_target_line(
        target_line_element,
        target_block_element,
        page_y,
        anchor_element
      );

      // Prevent the default event to be able to trigger on_drop events.
      event.preventDefault();

      return true;
    };

    const on_drop = (event: DragEvent): boolean => {
      if (!anchor_element || !is_dragging_block_ref.current) {
        return false;
      }

      const [is_file_transfer] = event_files(event);

      if (is_file_transfer) {
        return false;
      }

      const { target, dataTransfer: data_transfer, pageY: page_y } = event;
      const drag_data = data_transfer?.getData(DRAG_DATA_FORMAT) || "";
      const dragged_node = $get_node_by_key(drag_data);

      if (!dragged_node) {
        return false;
      }

      if (!is_html_element(target)) {
        return false;
      }

      const target_block_element = get_block_element(
        anchor_element,
        editor,
        event,
        true
      );

      if (!target_block_element) {
        return false;
      }

      const target_node = $get_nearest_node_from_dom_node(target_block_element);

      if (!target_node) {
        return false;
      }

      if (target_node === dragged_node) {
        return true;
      }

      const target_block_element_top =
        target_block_element.getBoundingClientRect().top;

      if (page_y >= target_block_element_top) {
        target_node.insertAfter(dragged_node);
      } else {
        target_node.insertBefore(dragged_node);
      }

      set_draggable_block_element(null);

      return true;
    };

    return merge_register(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => on_dragover(event),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => on_drop(event),
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [anchor_element, editor]);

  /**
   * Drag start handler.
   * @param event The drag event
   */
  const on_drag_start = (event: React.DragEvent<HTMLDivElement>): void => {
    const data_transfer = event.dataTransfer;

    if (!data_transfer || !draggable_block_element) {
      return;
    }

    set_drag_image(data_transfer, draggable_block_element);

    let node_key = "";

    editor.update(() => {
      const node = $get_nearest_node_from_dom_node(draggable_block_element);

      if (node) {
        node_key = node.getKey();
      }
    });

    is_dragging_block_ref.current = true;
    data_transfer.setData(DRAG_DATA_FORMAT, node_key);
  };

  /**
   * Drag end handler.
   */
  const on_drag_end = (): void => {
    is_dragging_block_ref.current = false;
    hide_target_line(target_line_ref.current);
  };

  if (!anchor_element || is_smaller_than_mobile) {
    return null;
  }

  return create_portal(
    <React.Fragment>
      <div
        aria-hidden={"true"}
        className={clsx(css["flex-center"], styles.dragger)}
        draggable={true}
        onDragEnd={on_drag_end}
        onDragStart={on_drag_start}
        ref={dragger_ref}
      >
        {is_editable ? <GripIcon className={styles.icon} /> : null}
      </div>
      <div
        aria-hidden={"true"}
        className={styles["target-line"]}
        ref={target_line_ref}
      />
    </React.Fragment>,
    anchor_element
  );
};

export default DraggableBlockPlugin;
