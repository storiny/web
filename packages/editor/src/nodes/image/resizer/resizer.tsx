import { clsx } from "clsx";
import { LexicalEditor } from "lexical";
import React from "react";

import { clamp } from "~/utils/clamp";

import { MAX_SCALE_FACTOR, MIN_SCALE_FACTOR } from "../image";
import styles from "./resizer.module.scss";

enum Direction {
  EAST = 1 << 0,
  NORTH = 1 << 3,
  SOUTH = 1 << 1,
  WEST = 1 << 2
}

const ImageResizer = ({
  onResizeStart,
  onResizeEnd,
  wrapperRef,
  editor,
  width,
  scaleFactor
}: {
  editor: LexicalEditor;
  onResizeEnd: (scale: number) => void;
  onResizeStart: () => void;
  scaleFactor: number;
  width: number;
  wrapperRef: React.RefObject<HTMLDivElement>;
}): React.ReactElement => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const userSelect = React.useRef<{ priority: string; value: string }>({
    priority: "",
    value: "default"
  });
  const positioningRef = React.useRef<{
    direction: number;
    isResizing: boolean;
    scale: number;
    startX: number;
  }>({
    scale: scaleFactor,
    direction: 0,
    isResizing: false,
    startX: 0
  });
  const editorRootElement = editor.getRootElement();

  /**
   * Sets the start cursor
   * @param direction Resize direction
   */
  const setStartCursor = (direction: Direction): void => {
    const nwse =
      (direction & Direction.NORTH && direction & Direction.WEST) ||
      (direction & Direction.SOUTH && direction & Direction.EAST);
    const cursorDir = nwse ? "nwse" : "nesw";

    if (editorRootElement !== null) {
      editorRootElement.style.setProperty(
        "cursor",
        `${cursorDir}-resize`,
        "important"
      );
    }

    if (document.body) {
      document.body.style.setProperty(
        "cursor",
        `${cursorDir}-resize`,
        "important"
      );

      userSelect.current.value = document.body.style.getPropertyValue(
        "-webkit-user-select"
      );
      userSelect.current.priority = document.body.style.getPropertyPriority(
        "-webkit-user-select"
      );

      document.body.style.setProperty(
        "-webkit-user-select",
        `none`,
        "important"
      );
    }
  };

  /**
   * Resets the cursor
   */
  const setEndCursor = (): void => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty("cursor", "text");
    }

    if (document.body !== null) {
      document.body.style.setProperty("cursor", "default");
      document.body.style.setProperty(
        "-webkit-user-select",
        userSelect.current.value,
        userSelect.current.priority
      );
    }
  };

  /**
   * Handles pointer down event
   * @param event Pointer event
   * @param direction Anchor direction
   */
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: Direction
  ): void => {
    if (!editor.isEditable()) {
      return;
    }

    const container = containerRef.current;
    const wrapper = wrapperRef.current;

    if (container !== null && wrapper !== null) {
      event.preventDefault();

      const positioning = positioningRef.current;
      positioning.startX = event.clientX;
      positioning.isResizing = true;
      positioning.direction = direction;

      setStartCursor(direction);
      onResizeStart();

      container.classList.add(styles.resizing);
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }
  };

  /**
   * Handles pointer move event
   * @param event Pointer event
   */
  const handlePointerMove = (event: PointerEvent): void => {
    const wrapper = wrapperRef.current;
    const positioning = positioningRef.current;

    if (wrapper !== null && positioning.isResizing) {
      let diff = Math.floor(positioning.startX - event.clientX);
      diff = positioning.direction & Direction.EAST ? -diff : diff;
      diff *= 2.5; // Sensitivity factor

      const scale = clamp(
        MIN_SCALE_FACTOR,
        ((width + diff) / width) * scaleFactor,
        MAX_SCALE_FACTOR
      );
      const nextWidth = width * scale;

      positioning.scale = scale;
      wrapper.style.setProperty("width", `${nextWidth}px`);
    }
  };

  /**
   * Handles pointer up event
   */
  const handlePointerUp = (): void => {
    const positioning = positioningRef.current;
    const container = containerRef.current;

    if (container !== null && positioning.isResizing) {
      positioning.startX = 0;
      positioning.isResizing = false;

      setEndCursor();
      onResizeEnd(positioning.scale);

      container.classList.remove(styles.resizing);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    }
  };

  return (
    <div ref={containerRef}>
      <div
        aria-label={"Resize along north-east"}
        className={clsx(styles.resizer, styles.ne)}
        onPointerDown={(event): void => {
          handlePointerDown(event, Direction.NORTH | Direction.EAST);
        }}
      />
      <div
        aria-label={"Resize along south-east"}
        className={clsx(styles.resizer, styles.se)}
        onPointerDown={(event): void => {
          handlePointerDown(event, Direction.SOUTH | Direction.EAST);
        }}
      />
      <div
        aria-label={"Resize along south-west"}
        className={clsx(styles.resizer, styles.sw)}
        onPointerDown={(event): void => {
          handlePointerDown(event, Direction.SOUTH | Direction.WEST);
        }}
      />
      <div
        aria-label={"Resize along north-west"}
        className={clsx(styles.resizer, styles.nw)}
        onPointerDown={(event): void => {
          handlePointerDown(event, Direction.NORTH | Direction.WEST);
        }}
      />
    </div>
  );
};

export default ImageResizer;
