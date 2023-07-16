import { Layer } from "../../../../types";

/**
 * Returns normalized dimensions for a layer
 * @param layer Layer
 */
export const getNormalizedDimensions = (
  layer: Pick<Layer, "width" | "height" | "x" | "y">
): {
  height: Layer["height"];
  width: Layer["width"];
  x: Layer["x"];
  y: Layer["y"];
} => {
  const ret = {
    width: layer.width,
    height: layer.height,
    x: layer.x,
    y: layer.y
  };

  if (layer.width < 0) {
    const nextWidth = Math.abs(layer.width);
    ret.width = nextWidth;
    ret.x = layer.x - nextWidth;
  }

  if (layer.height < 0) {
    const nextHeight = Math.abs(layer.height);
    ret.height = nextHeight;
    ret.y = layer.y - nextHeight;
  }

  return ret;
};
