import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  LexicalEditor
} from "lexical";
import React from "react";
import { createPortal } from "react-dom";

import GripIcon from "~/icons/Grip";

import { isHTMLElement } from "../../utils/is-html-element";
import { Point } from "../../utils/point";
import { Rect } from "../../utils/rect";
import { eventFiles } from "../rich-text";
import styles from "./block-dragger.module.scss";

const SPACE = 4;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";
const DRAG_DATA_FORMAT = "application/x-storiny-drag-block";
const TEXT_BOX_HORIZONTAL_PADDING = 28;

const Downward = 1;
const Upward = -1;
const Indeterminate = 0;

let prevIndex = Infinity;

const getCurrentIndex = (keysLength: number): number => {
  if (keysLength === 0) {
    return Infinity;
  }

  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }

  return Math.floor(keysLength / 2);
};

const getTopLevelNodeKeys = (editor: LexicalEditor): string[] =>
  editor.getEditorState().read(() => $getRoot().getChildrenKeys());

const getMargin = (
  element: Element | null,
  margin: "marginTop" | "marginBottom"
): number =>
  element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

const getCollapsedMargins = (
  elem: HTMLElement
): {
  marginBottom: number;
  marginTop: number;
} => {
  const { marginTop, marginBottom } = window.getComputedStyle(elem);
  const prevElemSiblingMarginBottom = getMargin(
    elem.previousElementSibling,
    "marginBottom"
  );
  const nextElemSiblingMarginTop = getMargin(
    elem.nextElementSibling,
    "marginTop"
  );
  const collapsedTopMargin = Math.max(
    parseFloat(marginTop),
    prevElemSiblingMarginBottom
  );
  const collapsedBottomMargin = Math.max(
    parseFloat(marginBottom),
    nextElemSiblingMarginTop
  );

  return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin };
};

const getBlockElement = (
  anchorElem: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false
): HTMLElement | null => {
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const topLevelNodeKeys = getTopLevelNodeKeys(editor);
  let blockElem: HTMLElement | null = null;

  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(topLevelNodeKeys[0]),
        editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1])
      ];
      const firstNodeRect = firstNode?.getBoundingClientRect();
      const lastNodeRect = lastNode?.getBoundingClientRect();

      if (firstNodeRect && lastNodeRect) {
        if (event.y < firstNodeRect.top) {
          blockElem = firstNode;
        } else if (event.y > lastNodeRect.bottom) {
          blockElem = lastNode;
        }

        if (blockElem) {
          return;
        }
      }
    }

    let index = getCurrentIndex(topLevelNodeKeys.length);
    let direction = Indeterminate;

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index];
      const element = editor.getElementByKey(key);

      if (element === null) {
        break;
      }

      const point = new Point(event.x, event.y);
      const domRect = Rect.fromDOM(element);
      const { marginTop, marginBottom } = getCollapsedMargins(element);
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop
      });
      const {
        result,
        reason: { isOnTopSide, isOnBottomSide }
      } = rect.contains(point);

      if (result) {
        blockElem = element;
        prevIndex = index;
        break;
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward;
        } else if (isOnBottomSide) {
          direction = Downward;
        } else {
          // Stop searching
          direction = Infinity;
        }
      }

      index += direction;
    }
  });

  return blockElem;
};

const isOnMenu = (element: HTMLElement): boolean =>
  !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);

const setMenuPosition = (
  targetElem: HTMLElement | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement
): void => {
  if (!targetElem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const targetRect = targetElem.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElem);
  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();

  const top =
    targetRect.top +
    (parseInt(targetStyle.lineHeight, 10) - floatingElemRect.height) / 2 -
    anchorElementRect.top;

  const left = SPACE;

  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
};

const setDragImage = (
  dataTransfer: DataTransfer,
  draggableBlockElem: HTMLElement
): void => {
  const { transform } = draggableBlockElem.style;

  // Remove `dragImage` borders
  draggableBlockElem.style.transform = "translateZ(0)";
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);

  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
};

const setTargetLine = (
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  mouseY: number,
  anchorElem: HTMLElement
): void => {
  const { top: targetBlockElemTop, height: targetBlockElemHeight } =
    targetBlockElem.getBoundingClientRect();
  const { top: anchorTop, width: anchorWidth } =
    anchorElem.getBoundingClientRect();
  const { marginTop, marginBottom } = getCollapsedMargins(targetBlockElem);
  let lineTop = targetBlockElemTop;

  if (mouseY >= targetBlockElemTop) {
    lineTop += targetBlockElemHeight + marginBottom / 2;
  } else {
    lineTop -= marginTop / 2;
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT;
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`;
  targetLineElem.style.width = `${
    anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2
  }px`;
  targetLineElem.style.opacity = ".4";
};

const hideTargetLine = (targetLineElem: HTMLElement | null): void => {
  if (targetLineElem) {
    targetLineElem.style.opacity = "0";
    targetLineElem.style.transform = "translate(-10000px, -10000px)";
  }
};

const BlockDraggerPlugin = (): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const anchorElem = document.body;
  const scrollerElem = document.body;
  const menuRef = React.useRef<HTMLDivElement>(null);
  const targetLineRef = React.useRef<HTMLDivElement>(null);
  const isDraggingBlockRef = React.useRef<boolean>(false);
  const [draggableBlockElem, setDraggableBlockElem] =
    React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const onMouseMove = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;

      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null);
        return;
      }

      if (target && isOnMenu(target)) {
        return;
      }

      const _draggableBlockElem = getBlockElement(anchorElem, editor, event);

      setDraggableBlockElem(_draggableBlockElem);
    };

    const onMouseLeave = (): void => {
      setDraggableBlockElem(null);
    };

    scrollerElem?.addEventListener("mousemove", onMouseMove);
    scrollerElem?.addEventListener("mouseleave", onMouseLeave);

    return () => {
      scrollerElem?.removeEventListener("mousemove", onMouseMove);
      scrollerElem?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [scrollerElem, anchorElem, editor]);

  React.useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem);
    }
  }, [anchorElem, draggableBlockElem]);

  React.useEffect(() => {
    const onDragover = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false;
      }

      const [isFileTransfer] = eventFiles(event);

      if (isFileTransfer) {
        return false;
      }

      const { pageY, target } = event;

      if (!isHTMLElement(target)) {
        return false;
      }

      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      const targetLineElem = targetLineRef.current;

      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }

      setTargetLine(targetLineElem, targetBlockElem, pageY, anchorElem);
      // Prevent default event to be able to trigger `onDrop` events
      event.preventDefault();
      return true;
    };

    const onDrop = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false;
      }

      const [isFileTransfer] = eventFiles(event);

      if (isFileTransfer) {
        return false;
      }

      const { target, dataTransfer, pageY } = event;
      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || "";
      const draggedNode = $getNodeByKey(dragData);

      if (!draggedNode) {
        return false;
      }

      if (!isHTMLElement(target)) {
        return false;
      }

      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);

      if (!targetBlockElem) {
        return false;
      }

      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem);

      if (!targetNode) {
        return false;
      }

      if (targetNode === draggedNode) {
        return true;
      }

      const targetBlockElemTop = targetBlockElem.getBoundingClientRect().top;

      if (pageY >= targetBlockElemTop) {
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
  }, [anchorElem, editor]);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>): void => {
    const dataTransfer = event.dataTransfer;

    if (!dataTransfer || !draggableBlockElem) {
      return;
    }

    setDragImage(dataTransfer, draggableBlockElem);
    let nodeKey = "";

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem);
      if (node) {
        nodeKey = node.getKey();
      }
    });

    isDraggingBlockRef.current = true;
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
  };

  const onDragEnd = (): void => {
    isDraggingBlockRef.current = false;
    hideTargetLine(targetLineRef.current);
  };

  return createPortal(
    <>
      <div
        className={clsx(styles.x, styles.menu)}
        draggable={true}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        ref={menuRef}
      >
        <GripIcon />
      </div>
      <div
        className={clsx(styles.x, styles["target-line"])}
        ref={targetLineRef}
      />
    </>,
    document.body
  );
};

export default BlockDraggerPlugin;
