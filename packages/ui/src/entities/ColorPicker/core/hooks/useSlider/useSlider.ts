import React from "react";

import { useActiveCursor } from "~/hooks/useActiveCursor";
import { clamp } from "~/utils/clamp";

import { Key } from "../../keys";
import { preventScroll } from "../preventScroll";
import { UseSliderProps } from "./useSlider.props";

/**
 * Computes the X axis position
 * @param event Pointer event
 * @param rectSize Bounding rect size
 * @param max Upper bound
 * @param min Lower bound
 */
const calculateX = (
  event: PointerEvent,
  rectSize: DOMRect,
  max: number,
  min: number
): number => {
  let x = (event.clientX - rectSize.left) / rectSize.width;
  x = clamp(min, Math.round(x * max), max);

  return x;
};

/**
 * Computes the Y axis position
 * @param event Pointer event
 * @param rectSize Bounding rect size
 * @param max Upper bound
 * @param min Lower bound
 */
const calculateY = (
  event: PointerEvent,
  rectSize: DOMRect,
  max: number,
  min: number
): number => {
  let y = (event.clientY - rectSize.top) / rectSize.height;
  y = clamp(min, Math.round(y * max), max);

  return y;
};

/**
 * Hook for providing accessible props to the slider element
 * @param props
 */
export const useSlider = (
  props: UseSliderProps
): {
  sliderProps: React.HTMLAttributes<HTMLElement>;
} => {
  const {
    ref,
    onStep,
    ariaLabel,
    ariaValueNow,
    ariaValueText,
    maxValue = 100,
    minValue = 0,
    step = 1,
    bigStep = 10,
    ...rest
  } = props;
  const restoreScrollRef = React.useRef<() => void>(() => {});
  const { onPointerUp: onCursorPointerUp, onPointerDown: onCursorPointerDown } =
    useActiveCursor("grabbing");

  // Restore scroll before unmounting
  React.useEffect(() => restoreScrollRef.current, []);

  const onKeyDown = (event: React.KeyboardEvent): void => {
    // Allow users to tab out. Don't prevent default if Tab is pressed
    if (event.key !== Key.Tab) {
      event.preventDefault();
    }

    let amount: number = event.shiftKey ? bigStep : step;

    switch (event.key) {
      case Key.ArrowLeft:
      case Key.ArrowDown: {
        onStep?.(-amount);
        break;
      }
      case Key.ArrowRight:
      case Key.ArrowUp: {
        onStep?.(amount);
        break;
      }
      case Key.Home: {
        if (rest.direction === "vertical" || rest.direction === "horizontal") {
          rest.onChange?.(minValue);
        }
        break;
      }
      case Key.End: {
        if (rest.direction === "vertical" || rest.direction === "horizontal") {
          rest.onChange?.(maxValue);
        }
        break;
      }
      default: {
        return;
      }
    }
  };

  const onPointerMove = React.useCallback(
    (event: PointerEvent) => {
      if (!ref.current || typeof rest.onChange !== "function") {
        return;
      }

      event.preventDefault();
      const rectSize = ref.current.getBoundingClientRect();

      if (rest.direction === "both") {
        let x = calculateX(event, rectSize, maxValue, minValue);
        let y = calculateY(event, rectSize, maxValue, minValue);
        return rest.onChange({ x, y });
      }

      if (rest.direction === "horizontal") {
        let x = calculateX(event, rectSize, maxValue, minValue);
        return rest.onChange(x);
      }

      if (rest.direction === "vertical") {
        let y = calculateY(event, rectSize, maxValue, minValue);
        return rest.onChange(y);
      }
    },
    [maxValue, minValue, rest, ref]
  );

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      onCursorPointerDown();

      if (!ref.current) {
        return;
      }

      event.preventDefault();
      restoreScrollRef.current = preventScroll();

      ref.current.focus();
      ref.current.onpointermove = onPointerMove;
      ref.current?.setPointerCapture(event.pointerId);

      onPointerMove(event as any);
    },
    [onCursorPointerDown, onPointerMove, ref]
  );

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent) => {
      onCursorPointerUp();

      if (!ref.current) {
        return;
      }

      ref.current.onpointermove = null;
      ref.current.releasePointerCapture(event.pointerId);

      restoreScrollRef.current();
      restoreScrollRef.current = (): void => {};
    },
    [onCursorPointerUp, ref]
  );

  return {
    sliderProps: {
      tabIndex: 0,
      onPointerDown,
      onPointerUp,
      onKeyDown,
      onPointerCancel: onPointerUp,
      role: "slider",
      "aria-valuemin": minValue,
      "aria-valuemax": maxValue,
      "aria-label": ariaLabel,
      "aria-valuenow": ariaValueNow,
      "aria-valuetext": ariaValueText
    }
  };
};
