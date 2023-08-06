import { Canvas, StaticCanvas } from "fabric";

import { isImageObject } from "../isImageObject";

/**
 * Predicate function for determining whether the canvas only contains
 * image objects
 * @param canvas Canvas
 */
export const containsOnlyImageObjects = (
  canvas: Canvas | StaticCanvas
): boolean => canvas.getObjects().every(isImageObject);
