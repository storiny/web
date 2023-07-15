import React from "react";

import { KEYS } from "../../constants";

/**
 * Predicate function for determining arrow keys
 * @param key Key code
 */
export const isArrowKey = (key: string): boolean =>
  key === KEYS.ARROW_LEFT ||
  key === KEYS.ARROW_RIGHT ||
  key === KEYS.ARROW_DOWN ||
  key === KEYS.ARROW_UP;

/**
 * Predicate function for determining whether to resize from the center
 * @param event Interaction event
 */
export const shouldResizeFromCenter = (
  event: MouseEvent | KeyboardEvent
): boolean => event.altKey;

/**
 * Predicate function for determining whether to maintain the aspect ratio
 * @param event Interaction event
 */
export const shouldMaintainAspectRatio = (
  event: MouseEvent | KeyboardEvent
): boolean => event.shiftKey;

/**
 * Predicate function for determining whether to rotate with a discrete angle
 * @param event Interaction event
 */
export const shouldRotateWithDiscreteAngle = (
  event: MouseEvent | KeyboardEvent | React.PointerEvent<HTMLCanvasLayer>
): boolean => event.shiftKey;
