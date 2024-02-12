import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
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

const SPACE = 4;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";
const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";
const TEXT_BOX_HORIZONTAL_PADDING = 28;

const Downward = 1;
const Upward = -1;
const Indeterminate = 0;

const prev_index = Infinity;

const get_current_index = (keys_length: number): number => {
  if (keys_length === 0) {
    return Infinity;
  }

  if (prev_index >= 0 && prev_index < keys_length) {
    return prev_index;
  }

  return Math.floor(keys_length / 2);
};

const get_top_level_node_keys = (editor: LexicalEditor): string[] =>
  editor.getEditorState().read(() => $get_root().getChildrenKeys());

const get_collapsed_margins = (
  elem: HTMLElement
): {
  margin_bottom: number;
  margin_top: number;
} => {
  const get_margin = (
    element: Element | null,
    margin: "marginTop" | "marginBottom"
  ): number =>
    element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

  const { marginTop: margin_top, marginBottom: margin_bottom } =
    window.getComputedStyle(elem);
  const prev_elem_sibling_margin_bottom = get_margin(
    elem.previousElementSibling,
    "marginBottom"
  );
  const next_elem_sibling_margin_top = get_margin(
    elem.nextElementSibling,
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

const get_block_element = (
  anchor_elem,
  editor: LexicalEditor,
  event: MouseEvent,
  use_edge_as_default = false
): HTMLElement | null => {
  const anchor_element_rect = anchor_elem.getBoundingClientRect();
  const top_level_node_keys = get_top_level_node_keys(editor);

  let block_elem = null;

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
          block_elem = first_node;
        } else if (event.y > last_node_rect.bottom) {
          block_elem = last_node;
        }

        if (block_elem) {
          return;
        }
      }
    }

    let index = getCurrentIndex(topLevelNodeKeys.length);
    let direction = Indeterminate;

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index];
      const elem = editor.getElementByKey(key);
      if (elem === null) {
        break;
      }
      const point = new Point(event.x, event.y);
      const dom_rect = Rect.fromDOM(elem);
      const { margin_top, margin_bottom } = getCollapsedMargins(elem);

      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + margin_bottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - margin_top
      });

      const {
        result,
        reason: { is_on_top_side, is_on_bottom_side }
      } = rect.contains(point);

      if (result) {
        block_elem = elem;
        prev_index = index;
        break;
      }

      if (direction === Indeterminate) {
        if (is_on_top_side) {
          direction = Upward;
        } else if (is_on_bottom_side) {
          direction = Downward;
        } else {
          // stop search block element
          direction = Infinity;
        }
      }

      index += direction;
    }
  });

  return block_elem;
};

const is_on_menu = (element: HTMLElement): boolean =>
  !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);

const set_menu_position = (target_elem, floating_elem, anchor_elem) => {
  if (!target_elem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const target_rect = targetElem.getBoundingClientRect();
  const target_style = window.getComputedStyle(targetElem);
  const floating_elem_rect = floatingElem.getBoundingClientRect();
  const anchor_element_rect = anchorElem.getBoundingClientRect();

  const top =
    targetRect.top +
    (parseInt(targetStyle.lineHeight, 10) - floatingElemRect.height) / 2 -
    anchorElementRect.top;

  const left = SPACE;

  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
};

const set_drag_image = (dataTransfer: DataTransfer, draggable_block_elem) => {
  const { transform } = draggableBlockElem.style;

  // Remove dragImage borders
  draggableBlockElem.style.transform = "translateZ(0)";
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);

  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
};

const set_target_line = (
  target_line_elem,
  target_block_elem,
  mouse_y,
  anchor_elem
) => {
  const { top: target_block_elem_top, height: target_block_elem_height } =
    targetBlockElem.getBoundingClientRect();
  const { top: anchor_top, width: anchor_width } =
    anchorElem.getBoundingClientRect();

  const { margin_top, margin_bottom } = getCollapsedMargins(targetBlockElem);
  let line_top = target_block_elem_top;
  if (mouse_y >= target_block_elem_top) {
    line_top += target_block_elem_height + margin_bottom / 2;
  } else {
    line_top -= margin_top / 2;
  }

  const top = line_top - anchor_top - TARGET_LINE_HALF_HEIGHT;
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`;
  targetLineElem.style.width = `${
    anchor_width - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2
  }px`;
  targetLineElem.style.opacity = ".4";
};

const hide_target_line = (target_line_elem) => {
  if (target_line_elem) {
    targetLineElem.style.opacity = "0";
    targetLineElem.style.transform = "translate(-10000px, -10000px)";
  }
};

const use_draggable_block_menu = (
  editor: LexicalEditor,
  anchor_elem,
  is_editable
): JSX.Element => {
  const scroller_elem = anchorElem.parentElement;

  const menu_ref = useRef<HTMLDivElement>(null);
  const target_line_ref = useRef<HTMLDivElement>(null);
  const is_dragging_block_ref = useRef<boolean>(false);
  const [draggable_block_elem, set_draggable_block_elem] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const target = event.target;
      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null);
        return;
      }

      if (isOnMenu(target)) {
        return;
      }

      const _draggable_block_elem = getBlockElement(anchorElem, editor, event);

      setDraggableBlockElem(_draggableBlockElem);
    };

    const on_mouse_leave = () => {
      setDraggableBlockElem(null);
    };

    scrollerElem?.addEventListener("mousemove", onMouseMove);
    scrollerElem?.addEventListener("mouseleave", onMouseLeave);

    return () => {
      scrollerElem?.removeEventListener("mousemove", onMouseMove);
      scrollerElem?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [scroller_elem, anchor_elem, editor]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem);
    }
  }, [anchor_elem, draggable_block_elem]);

  useEffect(() => {
    const on_dragover = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [is_file_transfer] = eventFiles(event);
      if (is_file_transfer) {
        return false;
      }
      const { pageY, target } = event;
      if (!isHTMLElement(target)) {
        return false;
      }
      const target_block_elem = getBlockElement(
        anchorElem,
        editor,
        event,
        true
      );
      const target_line_elem = targetLineRef.current;
      if (target_block_elem === null || target_line_elem === null) {
        return false;
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem);
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault();
      return true;
    };

    const on_drop = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [is_file_transfer] = eventFiles(event);
      if (is_file_transfer) {
        return false;
      }
      const { target, dataTransfer, pageY } = event;
      const drag_data = dataTransfer?.getData(DRAG_DATA_FORMAT) || "";
      const dragged_node = $getNodeByKey(dragData);
      if (!dragged_node) {
        return false;
      }
      if (!isHTMLElement(target)) {
        return false;
      }
      const target_block_elem = getBlockElement(
        anchorElem,
        editor,
        event,
        true
      );
      if (!target_block_elem) {
        return false;
      }
      const target_node = $getNearestNodeFromDOMNode(targetBlockElem);
      if (!target_node) {
        return false;
      }
      if (target_node === dragged_node) {
        return true;
      }
      const target_block_elem_top = targetBlockElem.getBoundingClientRect().top;
      if (pageY >= target_block_elem_top) {
        targetNode.insertAfter(draggedNode);
      } else {
        targetNode.insertBefore(draggedNode);
      }
      setDraggableBlockElem(null);

      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => onDragover(event),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => onDrop(event),
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [anchor_elem, editor]);

  const on_drag_start = (event: ReactDragEvent<HTMLDivElement>): void => {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer || !draggable_block_elem) {
      return;
    }
    setDragImage(dataTransfer, draggableBlockElem);
    let node_key = "";
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem);
      if (node) {
        node_key = node.getKey();
      }
    });
    isDraggingBlockRef.current = true;
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
  };

  const on_drag_end = (): void => {
    isDraggingBlockRef.current = false;
    hideTargetLine(targetLineRef.current);
  };

  return createPortal(
    <>
      <div
        className="icon draggable-block-menu"
        draggable={true}
        onDragEnd={on_drag_end}
        onDragStart={on_drag_start}
        ref={menu_ref}
      >
        <div className={is_editable ? "icon" : ""} />
      </div>
      <div className="draggable-block-target-line" ref={target_line_ref} />
    </>,
    anchorElem
  );
};

const DraggableBlockPlugin = ({
  anchor_elem = document.body
}: {
  anchor_elem?: HTMLElement;
}): JSX.Element => {
  const [editor] = useLexicalComposerContext();
  return useDraggableBlockMenu(editor, anchorElem, editor._editable);
};

export default DraggableBlockPlugin;
