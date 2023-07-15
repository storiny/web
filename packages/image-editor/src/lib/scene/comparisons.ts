import { NonDeletedExcalidrawLayer } from "../../core/layer/types";

export const hasBackground = (type: string) =>
  type === "rectangle" ||
  type === "ellipse" ||
  type === "diamond" ||
  type === "line" ||
  type === "freedraw";

export const hasStrokeColor = (type: string) =>
  type !== "image" && type !== "frame";

export const hasStrokeWidth = (type: string) =>
  type === "rectangle" ||
  type === "ellipse" ||
  type === "diamond" ||
  type === "freedraw" ||
  type === "arrow" ||
  type === "line";

export const hasStrokeStyle = (type: string) =>
  type === "rectangle" ||
  type === "ellipse" ||
  type === "diamond" ||
  type === "arrow" ||
  type === "line";

export const canChangeRoundness = (type: string) =>
  type === "rectangle" ||
  type === "arrow" ||
  type === "line" ||
  type === "diamond";

export const hasText = (type: string) => type === "text";

export const canHaveArrowheads = (type: string) => type === "arrow";

export const getLayerAtPosition = (
  layers: readonly NonDeletedExcalidrawLayer[],
  isAtPositionFn: (layer: NonDeletedExcalidrawLayer) => boolean
) => {
  let hitLayer = null;
  // We need to to hit testing from front (end of the array) to back (beginning of the array)
  // because array is ordered from lower z-index to highest and we want layer z-index
  // with higher z-index
  for (let index = layers.length - 1; index >= 0; --index) {
    const layer = layers[index];
    if (layer.isDeleted) {
      continue;
    }
    if (isAtPositionFn(layer)) {
      hitLayer = layer;
      break;
    }
  }

  return hitLayer;
};

export const getLayersAtPosition = (
  layers: readonly NonDeletedExcalidrawLayer[],
  isAtPositionFn: (layer: NonDeletedExcalidrawLayer) => boolean
) => layers.filter((layer) => !layer.isDeleted && isAtPositionFn(layer));
