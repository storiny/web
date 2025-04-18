import { clsx } from "clsx";
import { LexicalEditor } from "lexical";
import React from "react";

import { clamp } from "~/utils/clamp";

import { MAX_SCALE_FACTOR, MIN_SCALE_FACTOR } from "../../image";
import styles from "./resizer.module.scss";

enum Direction {
  EAST /* */ = 1 << 0,
  NORTH /**/ = 1 << 3,
  SOUTH /**/ = 1 << 1,
  WEST /* */ = 1 << 2
}

const ImageResizer = ({
  on_resize_start,
  on_resize_end,
  items_container_ref,
  editor,
  width,
  scale_factor
}: {
  editor: LexicalEditor;
  items_container_ref: React.RefObject<HTMLDivElement | null>;
  on_resize_end: (scale: number) => void;
  on_resize_start: () => void;
  scale_factor: number;
  width: number;
}): React.ReactElement => {
  const container_ref = React.useRef<HTMLDivElement | null>(null);
  const user_select = React.useRef<{ priority: string; value: string }>({
    priority: "",
    value: "default"
  });
  const positioning_ref = React.useRef<{
    direction: number;
    is_resizing: boolean;
    scale: number;
    start_x: number;
  }>({
    scale: scale_factor,
    direction: 0,
    is_resizing: false,
    start_x: 0
  });
  const editor_root_element = editor.getRootElement();

  /**
   * Sets the start cursor
   * @param direction Resize direction
   */
  const set_start_cursor = (direction: Direction): void => {
    const nwse =
      (direction & Direction.NORTH && direction & Direction.WEST) ||
      (direction & Direction.SOUTH && direction & Direction.EAST);
    const cursor_dir = nwse ? "nwse" : "nesw";

    if (editor_root_element !== null) {
      editor_root_element.style.setProperty(
        "cursor",
        `${cursor_dir}-resize`,
        "important"
      );
    }

    if (document.body) {
      document.body.style.setProperty(
        "cursor",
        `${cursor_dir}-resize`,
        "important"
      );

      user_select.current.value = document.body.style.getPropertyValue(
        "-webkit-user-select"
      );
      user_select.current.priority = document.body.style.getPropertyPriority(
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
  const set_end_cursor = (): void => {
    if (editor_root_element !== null) {
      editor_root_element.style.setProperty("cursor", "text");
    }

    if (document.body !== null) {
      document.body.style.setProperty("cursor", "default");
      document.body.style.setProperty(
        "-webkit-user-select",
        user_select.current.value,
        user_select.current.priority
      );
    }
  };

  /**
   * Handles pointer down event
   * @param event Pointer event
   * @param direction Anchor direction
   */
  const handle_pointer_down = (
    event: React.PointerEvent<HTMLSpanElement>,
    direction: Direction
  ): void => {
    if (!editor.isEditable()) {
      return;
    }

    const container = container_ref.current;
    const wrapper = items_container_ref.current;

    if (container !== null && wrapper !== null) {
      event.preventDefault();

      const positioning = positioning_ref.current;
      positioning.start_x = event.clientX;
      positioning.is_resizing = true;
      positioning.direction = direction;

      set_start_cursor(direction);
      on_resize_start();

      container.classList.add(styles.resizing);
      document.addEventListener("pointermove", handle_pointer_move);
      document.addEventListener("pointerup", handle_pointer_up);
    }
  };

  /**
   * Handles pointer move event
   * @param event Pointer event
   */
  const handle_pointer_move = (event: PointerEvent): void => {
    const wrapper = items_container_ref.current;
    const positioning = positioning_ref.current;

    if (wrapper !== null && positioning.is_resizing) {
      let diff = Math.floor(positioning.start_x - event.clientX);
      diff = positioning.direction & Direction.EAST ? -diff : diff;
      diff *= 2.5; // Sensitivity factor

      const scale = clamp(
        MIN_SCALE_FACTOR,
        ((width + diff) / width) * scale_factor,
        MAX_SCALE_FACTOR
      );
      const next_width = width * scale;

      positioning.scale = scale;
      wrapper.style.setProperty("width", `${next_width}px`);
    }
  };

  /**
   * Handles pointer up event
   */
  const handle_pointer_up = (): void => {
    const positioning = positioning_ref.current;
    const container = container_ref.current;

    if (container !== null && positioning.is_resizing) {
      positioning.start_x = 0;
      positioning.is_resizing = false;

      set_end_cursor();
      on_resize_end(positioning.scale);

      container.classList.remove(styles.resizing);
      document.removeEventListener("pointermove", handle_pointer_move);
      document.removeEventListener("pointerup", handle_pointer_up);
    }
  };

  return (
    <div ref={container_ref}>
      <span
        aria-label={"Resize along north-east"}
        className={clsx(styles.resizer, styles.ne)}
        onPointerDown={(event): void => {
          handle_pointer_down(event, Direction.NORTH | Direction.EAST);
        }}
      />
      <span
        aria-label={"Resize along south-east"}
        className={clsx(styles.resizer, styles.se)}
        onPointerDown={(event): void => {
          handle_pointer_down(event, Direction.SOUTH | Direction.EAST);
        }}
      />
      <span
        aria-label={"Resize along south-west"}
        className={clsx(styles.resizer, styles.sw)}
        onPointerDown={(event): void => {
          handle_pointer_down(event, Direction.SOUTH | Direction.WEST);
        }}
      />
      <span
        aria-label={"Resize along north-west"}
        className={clsx(styles.resizer, styles.nw)}
        onPointerDown={(event): void => {
          handle_pointer_down(event, Direction.NORTH | Direction.WEST);
        }}
      />
    </div>
  );
};

export default ImageResizer;
