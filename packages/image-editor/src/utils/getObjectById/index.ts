import { Canvas } from "fabric";
import { BaseFabricObject } from "fabric";

/**
 * Returns an object by id from the canvas
 * @param canvas Canvas
 * @param id Object ID
 */
export const getObjectById = (
  canvas: Canvas | null,
  id: string
): BaseFabricObject | undefined =>
  canvas
    ? canvas.getObjects().find((object) => object.get("id") === id)
    : undefined;
