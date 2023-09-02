import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  LexicalEditor
} from "lexical";
import React from "react";
import { createPortal } from "react-dom";

import NoSsr from "~/components/NoSsr";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import GripIcon from "~/icons/Grip";
import { breakpoints } from "~/theme/breakpoints";

import { getCollapsedMargins } from "../../utils/get-collapsed-margins";
import { getTopLevelNodeKeys } from "../../utils/get-top-level-node-keys";
import { isHTMLElement } from "../../utils/is-html-element";
import { Point } from "../../utils/point";
import { Rect } from "../../utils/rect";
import { eventFiles } from "../rich-text";
import styles from "./block-dragger.module.scss";

const DRAGGER_HEIGHT = 30; // (px)
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAG_DATA_FORMAT = "application/x-storiny-drag-block";

enum Direction {
  UPWARD /*       */ = -1,
  INDETERMINATE /**/ = 0,
  DOWNWARD /*     */ = 1
}

let prevIndex = Infinity;

/**
 * Returns the current index in the keys
 * @param keysLength Keys length
 */
const getCurrentIndex = (keysLength: number): number => {
  if (keysLength === 0) {
    return Infinity;
  }

  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }

  return Math.floor(keysLength / 2);
};

/**
 * Returns the block element
 * @param editor Editor
 * @param event Mouse event
 * @param useEdgeAsDefault Whether to use edge as default
 */
const getBlockElement = (
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false
): HTMLElement | null => {
  const docRect = document.body.getBoundingClientRect();
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
    let direction = Direction.INDETERMINATE;

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
        left: docRect.left,
        right: docRect.right,
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

      if (direction === Direction.INDETERMINATE) {
        if (isOnTopSide) {
          direction = Direction.UPWARD;
        } else if (isOnBottomSide) {
          direction = Direction.DOWNWARD;
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

/**
 * Predicate function for determining whether the element is on the dragger
 * @param element Element
 */
const isOnDragger = (element: HTMLElement): boolean =>
  !!element.closest("[data-dragger]");

/**
 * Sets the dragger position
 * @param targetElement Target element
 * @param draggerElement Dragger element
 */
const setDraggerPosition = (
  targetElement: HTMLElement | null,
  draggerElement: HTMLElement
): void => {
  if (!targetElement) {
    draggerElement.style.display = "none";
    return;
  }

  const targetRect = targetElement.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElement);
  const mainRect = document.querySelector("main")?.getBoundingClientRect();

  if (mainRect) {
    const top =
      targetRect.top -
      mainRect.top +
      (parseInt(targetStyle.lineHeight, 10) - DRAGGER_HEIGHT) / 2;
    const left = targetRect.left - mainRect.left - 42;

    draggerElement.style.display = "flex";
    draggerElement.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }
};

/**
 * Sets the drag image
 * @param dataTransfer Data transfer
 * @param draggableBlockElement Block element
 */
const setDragImage = (
  dataTransfer: DataTransfer,
  draggableBlockElement: HTMLElement
): void => {
  const { transform } = draggableBlockElement.style;

  // Remove `dragImage` borders
  draggableBlockElement.style.transform = "translateZ(0)";
  dataTransfer.setDragImage(draggableBlockElement, 0, 0);

  setTimeout(() => {
    draggableBlockElement.style.transform = transform;
  });
};

/**
 * Sets the position of the target line
 * @param targetLineElement Target line element
 * @param targetBlockElement Target block element
 * @param mouseY Mouse Y
 */
const setTargetLine = (
  targetLineElement: HTMLElement,
  targetBlockElement: HTMLElement,
  mouseY: number
): void => {
  const targetBlockRect = targetBlockElement.getBoundingClientRect();
  const mainRect = document.querySelector("main")?.getBoundingClientRect();
  const { marginTop, marginBottom } = getCollapsedMargins(targetBlockElement);
  let lineTop = targetBlockRect.top;

  if (mouseY >= lineTop) {
    lineTop += targetBlockRect.height + marginBottom / 2;
  } else {
    lineTop -= marginTop / 2;
  }

  if (mainRect) {
    const top = lineTop - mainRect.top - TARGET_LINE_HALF_HEIGHT;

    targetLineElement.style.transform = `translateY(${top}px)`;
    targetLineElement.style.display = "block";
  }
};

/**
 * Hides the target line
 * @param targetLineElement Target line element
 */
const hideTargetLine = (targetLineElement: HTMLElement | null): void => {
  if (targetLineElement) {
    targetLineElement.style.display = "none";
  }
};

const BlockDraggerPluginImpl = (): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const mainElement = document.querySelector("main");
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const draggerRef = React.useRef<HTMLDivElement | null>(null);
  const targetLineRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingBlockRef = React.useRef<boolean>(false);
  const [draggableBlockElement, setDraggableBlockElement] =
    React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    /**
     * Mouse move listener
     * @param event Mouse event
     */
    const onMouseMove = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;

      if (!isHTMLElement(target)) {
        setDraggableBlockElement(null);
      } else if (!isOnDragger(target)) {
        setDraggableBlockElement(getBlockElement(editor, event));
      }
    };

    /**
     * Mouse leave listener
     */
    const onMouseLeave = (): void => {
      setDraggableBlockElement(null);
    };

    mainElement?.addEventListener("mousemove", onMouseMove);
    mainElement?.addEventListener("mouseleave", onMouseLeave);

    return () => {
      mainElement?.removeEventListener("mousemove", onMouseMove);
      mainElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [editor, mainElement]);

  React.useEffect(() => {
    if (draggerRef.current) {
      setDraggerPosition(draggableBlockElement, draggerRef.current);
    }
  }, [draggableBlockElement]);

  React.useEffect(() => {
    /**
     * Drag over listener
     * @param event Drag event
     */
    const onDragover = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false;
      }

      const [isFileTransfer] = eventFiles(event);
      const { pageY, target } = event;

      if (isFileTransfer || !isHTMLElement(target)) {
        return false;
      }

      const targetBlockElement = getBlockElement(editor, event, true);
      const targetLineElement = targetLineRef.current;

      if (targetBlockElement === null || targetLineElement === null) {
        return false;
      }

      setTargetLine(targetLineElement, targetBlockElement, pageY);
      // Prevent default event to be able to trigger `onDrop` events
      event.preventDefault();
      return true;
    };

    /**
     * Drop listener
     * @param event Event
     */
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

      if (!draggedNode || !isHTMLElement(target)) {
        return false;
      }

      const targetBlockElement = getBlockElement(editor, event, true);

      if (!targetBlockElement) {
        return false;
      }

      const targetNode = $getNearestNodeFromDOMNode(targetBlockElement);

      if (!targetNode || targetNode === draggedNode) {
        return true;
      }

      const targetBlockElemTop = targetBlockElement.getBoundingClientRect().top;

      if (pageY >= targetBlockElemTop) {
        targetNode.insertAfter(draggedNode);
      } else {
        targetNode.insertBefore(draggedNode);
      }

      setDraggableBlockElement(null);
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
  }, [editor]);

  /**
   * Drag start listener
   * @param event Drag event
   */
  const onDragStart = (event: React.DragEvent<HTMLDivElement>): void => {
    const dataTransfer = event.dataTransfer;

    if (!dataTransfer || !draggableBlockElement) {
      return;
    }

    setDragImage(dataTransfer, draggableBlockElement);
    let nodeKey = "";

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElement);
      if (node) {
        nodeKey = node.getKey();
      }
    });

    isDraggingBlockRef.current = true;
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
  };

  /**
   * Drag end listener
   */
  const onDragEnd = (): void => {
    isDraggingBlockRef.current = false;
    hideTargetLine(targetLineRef.current);
  };

  if (isSmallerThanDesktop || !mainElement) {
    return null;
  }

  return createPortal(
    <>
      <div
        aria-hidden
        className={clsx("flex-center", styles.x, styles.dragger)}
        data-dragger={"true"}
        draggable={true}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        ref={draggerRef}
      >
        <GripIcon style={{ pointerEvents: "none" }} />
      </div>
      <div
        aria-hidden
        className={clsx(styles.x, styles["target-line"])}
        ref={targetLineRef}
      />
    </>,
    mainElement
  );
};

const BlockDraggerPlugin = (): React.ReactElement => (
  <NoSsr>
    <BlockDraggerPluginImpl />
  </NoSsr>
);

export default BlockDraggerPlugin;
