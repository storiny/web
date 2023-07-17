import { RectangleBox } from "../types";

/**
 * Returns the absolute coordinates of rectangle box
 * @param boxSceneCoords Rectangle box coordinates
 */
export const getRectangleBoxAbsoluteCoords = (
  boxSceneCoords: RectangleBox
): [number, number, number, number, number, number] => [
  boxSceneCoords.x,
  boxSceneCoords.y,
  boxSceneCoords.x + boxSceneCoords.width,
  boxSceneCoords.y + boxSceneCoords.height,
  boxSceneCoords.x + boxSceneCoords.width / 2,
  boxSceneCoords.y + boxSceneCoords.height / 2
];
