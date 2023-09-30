import React from "react";

import { use_active_cursor } from "~/hooks/use-active-cursor";
import { clamp } from "~/utils/clamp";

import { Key } from "../../keys";
import { prevent_scroll } from "../prevent-scroll";
import { UseSliderProps } from "./use-slider.props";

/**
 * Computes the X axis position
 * @param event Pointer event
 * @param rect_size Bounding rect size
 * @param max Upper bound
 * @param min Lower bound
 */
const calculate_x = (
  event: PointerEvent,
  rect_size: DOMRect,
  max: number,
  min: number
): number => {
  let x = (event.clientX - rect_size.left) / rect_size.width;
  x = clamp(min, Math.round(x * max), max);
  return x;
};

/**
 * Computes the Y axis position
 * @param event Pointer event
 * @param rect_size Bounding rect size
 * @param max Upper bound
 * @param min Lower bound
 */
const calculate_y = (
  event: PointerEvent,
  rect_size: DOMRect,
  max: number,
  min: number
): number => {
  let y = (event.clientY - rect_size.top) / rect_size.height;
  y = clamp(min, Math.round(y * max), max);
  return y;
};

/**
 * Hook for providing accessible props to the slider element
 * @param props
 */
export const use_slider = (
  props: UseSliderProps
): {
  slider_props: React.HTMLAttributes<HTMLElement>;
} => {
  const {
    ref,
    on_step,
    aria_label,
    aria_value_now,
    aria_value_text,
    max_value = 100,
    min_value = 0,
    step = 1,
    big_step = 10,
    ...rest
  } = props;
  const restore_scroll_ref = React.useRef<() => void>(() => undefined);
  const {
    on_pointer_up: on_cursor_pointer_up,
    on_pointer_down: on_cursor_pointer_down
  } = use_active_cursor("grabbing");

  // Restore scroll before unmounting
  React.useEffect(() => restore_scroll_ref.current, []);

  const on_key_down = (event: React.KeyboardEvent): void => {
    // Allow users to tab out. Don't prevent default if Tab is pressed
    if (event.key !== Key.Tab) {
      event.preventDefault();
    }

    const amount: number = event.shiftKey ? big_step : step;

    switch (event.key) {
      case Key.ArrowLeft:
      case Key.ArrowDown: {
        on_step?.(-amount);
        break;
      }
      case Key.ArrowRight:
      case Key.ArrowUp: {
        on_step?.(amount);
        break;
      }
      case Key.Home: {
        if (rest.direction === "vertical" || rest.direction === "horizontal") {
          rest.on_change?.(min_value);
        }
        break;
      }
      case Key.End: {
        if (rest.direction === "vertical" || rest.direction === "horizontal") {
          rest.on_change?.(max_value);
        }
        break;
      }
      default: {
        return;
      }
    }
  };

  const on_pointer_move = React.useCallback(
    (event: PointerEvent) => {
      if (!ref.current || typeof rest.on_change !== "function") {
        return;
      }

      event.preventDefault();
      const rect_size = ref.current.getBoundingClientRect();

      if (rest.direction === "both") {
        const x = calculate_x(event, rect_size, max_value, min_value);
        const y = calculate_y(event, rect_size, max_value, min_value);
        return rest.on_change({ x, y });
      }

      if (rest.direction === "horizontal") {
        const x = calculate_x(event, rect_size, max_value, min_value);
        return rest.on_change(x);
      }

      if (rest.direction === "vertical") {
        const y = calculate_y(event, rect_size, max_value, min_value);
        return rest.on_change(y);
      }
    },
    [max_value, min_value, rest, ref]
  );

  const on_pointer_down = React.useCallback(
    (event: React.PointerEvent) => {
      on_cursor_pointer_down();

      if (!ref.current) {
        return;
      }

      event.preventDefault();
      restore_scroll_ref.current = prevent_scroll();

      ref.current.focus();
      ref.current.onpointermove = on_pointer_move;
      ref.current?.setPointerCapture(event.pointerId);

      on_pointer_move(event as any);
    },
    [on_cursor_pointer_down, on_pointer_move, ref]
  );

  const on_pointer_up = React.useCallback(
    (event: React.PointerEvent) => {
      on_cursor_pointer_up();

      if (!ref.current) {
        return;
      }

      ref.current.onpointermove = null;
      ref.current.releasePointerCapture(event.pointerId);

      restore_scroll_ref.current();
      restore_scroll_ref.current = (): void => undefined;
    },
    [on_cursor_pointer_up, ref]
  );

  return {
    slider_props: {
      tabIndex: 0,
      onPointerDown: on_pointer_down,
      onPointerUp: on_pointer_up,
      onKeyDown: on_key_down,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      onPointerCancel: on_pointer_up,
      role: "slider",
      "aria-valuemin": min_value,
      "aria-valuemax": max_value,
      "aria-label": aria_label,
      "aria-valuenow": aria_value_now,
      "aria-valuetext": aria_value_text
    }
  };
};
