import { Shape, SHAPES } from "../../constants";

/**
 * Returns a shape by key
 * @param key Key value
 */
export const findShapeByKey = (key: string): Shape | null => {
  const shape = SHAPES.find(
    (shape) =>
      (shape.numericKey != null && key === shape.numericKey.toString()) ||
      (shape.key &&
        (typeof shape.key === "string"
          ? shape.key === key
          : (shape.key as readonly string[]).includes(key)))
  );

  return shape?.value || null;
};
