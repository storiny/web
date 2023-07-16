import { Layer } from "../../../../types";
import { mutateLayer } from "../../mutate";

/**
 * Resizes perfect line for NW handler
 * @param layer Layer
 * @param x X value
 * @param y Y value
 */
export const resizePerfectLineForNWHandler = (
  layer: Layer,
  x: number,
  y: number
): void => {
  const anchorX = layer.x + layer.width;
  const anchorY = layer.y + layer.height;
  const distanceToAnchorX = x - anchorX;
  const distanceToAnchorY = y - anchorY;

  if (Math.abs(distanceToAnchorX) < Math.abs(distanceToAnchorY) / 2) {
    mutateLayer(layer, {
      x: anchorX,
      width: 0,
      y,
      height: -distanceToAnchorY
    });
  } else if (Math.abs(distanceToAnchorY) < Math.abs(layer.width) / 2) {
    mutateLayer(layer, {
      y: anchorY,
      height: 0
    });
  } else {
    const nextHeight =
      Math.sign(distanceToAnchorY) * Math.sign(distanceToAnchorX) * layer.width;

    mutateLayer(layer, {
      x,
      y: anchorY - nextHeight,
      width: -distanceToAnchorX,
      height: nextHeight
    });
  }
};
