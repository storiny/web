import { Canvas, StaticCanvas } from "fabric";

import { is_image_object } from "../is-image-object";

/**
 * Predicate function for determining whether the canvas only contains
 * image objects
 * @param canvas Canvas
 */
export const contains_only_image_objects = (
  canvas: Canvas | StaticCanvas
): boolean => canvas.getObjects().every(is_image_object);
