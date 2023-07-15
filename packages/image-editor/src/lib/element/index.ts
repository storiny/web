import { isInvisiblySmallLayer } from "./sizeHelpers";
import { isLinearLayerType } from "./typeChecks";
import {
  ExcalidrawFrameLayer,
  ExcalidrawLayer,
  NonDeleted,
  NonDeletedExcalidrawLayer
} from "./types";

export {
  getArrowheadPoints,
  getClosestLayerBounds,
  getCommonBounds,
  getDiamondPoints,
  getLayerAbsoluteCoords,
  getLayerBounds
} from "./bounds/bounds";
export {
  hitTest,
  isHittingLayerBoundingBoxWithoutHittingLayer
} from "./collision/collision";
export {
  dragNewLayer,
  dragSelectedLayers,
  getDragOffsetXY
} from "./dragLayers";
export {
  duplicateLayer,
  newImageLayer,
  newLayer,
  newLinearLayer,
  newTextLayer,
  refreshTextDimensions,
  updateTextLayer
} from "./newLayer";
export {
  getResizeArrowDirection,
  getResizeOffsetXY,
  transformLayers
} from "./resizeLayers";
export {
  getCursorForResizingLayer,
  getLayerWithTransformHandleType,
  getTransformHandleTypeFromCoords,
  resizeTest
} from "./resizeTest";
export { showSelectedShapeActions } from "./showSelectedShapeActions";
export {
  getLockedLinearCursorAlignSize,
  getNormalizedDimensions,
  getPerfectLayerSize,
  isInvisiblySmallLayer,
  resizePerfectLineForNWHandler
} from "./sizeHelpers";
export { redrawTextBoundingBox } from "./textLayer";
export { textWysiwyg } from "./textWysiwyg";
export {
  getTransformHandles,
  getTransformHandlesFromCoords,
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS
} from "./transformHandles";
export { isCanvasLayer, isFrameLayer, isTextLayer } from "./typeChecks";

export const getSceneVersion = (layers: readonly ExcalidrawLayer[]) =>
  layers.reduce((acc, el) => acc + el.version, 0);

export const getVisibleLayers = (layers: readonly ExcalidrawLayer[]) =>
  layers.filter(
    (el) => !el.isDeleted && !isInvisiblySmallLayer(el)
  ) as readonly NonDeletedExcalidrawLayer[];

export const getNonDeletedLayers = (layers: readonly ExcalidrawLayer[]) =>
  layers.filter(
    (layer) => !layer.isDeleted
  ) as readonly NonDeletedExcalidrawLayer[];

export const getNonDeletedFrames = (frames: readonly ExcalidrawFrameLayer[]) =>
  frames.filter(
    (frame) => !frame.isDeleted
  ) as readonly NonDeleted<ExcalidrawFrameLayer>[];

export const isNonDeletedLayer = <T extends ExcalidrawLayer>(
  layer: T
): layer is NonDeleted<T> => !layer.isDeleted;

const _clearLayers = (layers: readonly ExcalidrawLayer[]): ExcalidrawLayer[] =>
  getNonDeletedLayers(layers).map((layer) =>
    isLinearLayerType(layer.type)
      ? { ...layer, lastCommittedPoint: null }
      : layer
  );

export const clearLayersForDatabase = (layers: readonly ExcalidrawLayer[]) =>
  _clearLayers(layers);

export const clearLayersForExport = (layers: readonly ExcalidrawLayer[]) =>
  _clearLayers(layers);

export const clearLayersForLocalStorage = (
  layers: readonly ExcalidrawLayer[]
) => _clearLayers(layers);
