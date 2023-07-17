import { Layer } from "../../../../types";

/**
 * Returns diamond points
 * @param layer Layer
 */
export const getDiamondPoints = (
  layer: Layer
): [number, number, number, number, number, number, number, number] => {
  // We add +1 to avoid these numbers to be 0
  // otherwise rough.js will throw an error complaining about it
  const topX = Math.floor(layer.width / 2) + 1;
  const topY = 0;
  const rightX = layer.width;
  const rightY = Math.floor(layer.height / 2) + 1;
  const bottomX = topX;
  const bottomY = layer.height;
  const leftX = 0;

  return [topX, topY, rightX, rightY, bottomX, bottomY, leftX, rightY];
};
