import { ROUNDNESS } from "../constants";
import { AppState } from "../types";
import { MarkNonNullable } from "../utility-types";
import {
  ExcalidrawBindableLayer,
  ExcalidrawFrameLayer,
  ExcalidrawFreeDrawLayer,
  ExcalidrawGenericLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextContainer,
  ExcalidrawTextLayer,
  ExcalidrawTextLayerWithContainer,
  InitializedExcalidrawImageLayer,
  RoundnessType
} from "./types";

export const isGenericLayer = (
  layer: ExcalidrawLayer | null
): layer is ExcalidrawGenericLayer =>
  layer != null &&
  (layer.type === "selection" ||
    layer.type === "rectangle" ||
    layer.type === "diamond" ||
    layer.type === "ellipse");

export const isInitializedImageLayer = (
  layer: ExcalidrawLayer | null
): layer is InitializedExcalidrawImageLayer =>
  !!layer && layer.type === "image" && !!layer.fileId;

export const isImageLayer = (
  layer: ExcalidrawLayer | null
): layer is ExcalidrawImageLayer => !!layer && layer.type === "image";

export const isTextLayer = (
  layer: ExcalidrawLayer | null
): layer is ExcalidrawTextLayer => layer != null && layer.type === "text";

export const isFrameLayer = (
  layer: ExcalidrawLayer | null
): layer is ExcalidrawFrameLayer => layer != null && layer.type === "frame";

export const isFreeDrawLayer = (
  layer?: ExcalidrawLayer | null
): layer is ExcalidrawFreeDrawLayer =>
  layer != null && isFreeDrawLayerType(layer.type);

export const isFreeDrawLayerType = (
  layerType: ExcalidrawLayer["type"]
): boolean => layerType === "freedraw";

export const isLinearLayer = (
  layer?: ExcalidrawLayer | null
): layer is ExcalidrawLinearLayer =>
  layer != null && isLinearLayerType(layer.type);

export const isArrowLayer = (
  layer?: ExcalidrawLayer | null
): layer is ExcalidrawLinearLayer => layer != null && layer.type === "arrow";

export const isLinearLayerType = (
  layerType: AppState["activeTool"]["type"]
): boolean => layerType === "arrow" || layerType === "line";

export const isBindingLayer = (
  layer?: ExcalidrawLayer | null,
  includeLocked = true
): layer is ExcalidrawLinearLayer =>
  layer != null &&
  (!layer.locked || includeLocked === true) &&
  isBindingLayerType(layer.type);

export const isBindingLayerType = (
  layerType: AppState["activeTool"]["type"]
): boolean => layerType === "arrow";

export const isBindableLayer = (
  layer: ExcalidrawLayer | null,
  includeLocked = true
): layer is ExcalidrawBindableLayer =>
  layer != null &&
  (!layer.locked || includeLocked === true) &&
  (layer.type === "rectangle" ||
    layer.type === "diamond" ||
    layer.type === "ellipse" ||
    layer.type === "image" ||
    (layer.type === "text" && !layer.containerId));

export const isTextBindableContainer = (
  layer: ExcalidrawLayer | null,
  includeLocked = true
): layer is ExcalidrawTextContainer =>
  layer != null &&
  (!layer.locked || includeLocked === true) &&
  (layer.type === "rectangle" ||
    layer.type === "diamond" ||
    layer.type === "ellipse" ||
    isArrowLayer(layer));

export const isCanvasLayer = (layer: any): boolean =>
  layer?.type === "text" ||
  layer?.type === "diamond" ||
  layer?.type === "rectangle" ||
  layer?.type === "ellipse" ||
  layer?.type === "arrow" ||
  layer?.type === "freedraw" ||
  layer?.type === "line";

export const hasBoundTextLayer = (
  layer: ExcalidrawLayer | null
): layer is MarkNonNullable<ExcalidrawBindableLayer, "boundLayers"> =>
  isTextBindableContainer(layer) &&
  !!layer.boundLayers?.some(({ type }) => type === "text");

export const isBoundToContainer = (
  layer: ExcalidrawLayer | null
): layer is ExcalidrawTextLayerWithContainer =>
  layer !== null &&
  "containerId" in layer &&
  layer.containerId !== null &&
  isTextLayer(layer);

export const isUsingAdaptiveRadius = (type: string) => type === "rectangle";

export const isUsingProportionalRadius = (type: string) =>
  type === "line" || type === "arrow" || type === "diamond";

export const canApplyRoundnessTypeToLayer = (
  roundnessType: RoundnessType,
  layer: ExcalidrawLayer
) => {
  if (
    (roundnessType === ROUNDNESS.ADAPTIVE_RADIUS ||
      // if legacy roundness, it can be applied to layers that currently
      // use adaptive radius
      roundnessType === ROUNDNESS.LEGACY) &&
    isUsingAdaptiveRadius(layer.type)
  ) {
    return true;
  }
  if (
    roundnessType === ROUNDNESS.PROPORTIONAL_RADIUS &&
    isUsingProportionalRadius(layer.type)
  ) {
    return true;
  }

  return false;
};

export const getDefaultRoundnessTypeForLayer = (layer: ExcalidrawLayer) => {
  if (
    layer.type === "arrow" ||
    layer.type === "line" ||
    layer.type === "diamond"
  ) {
    return {
      type: ROUNDNESS.PROPORTIONAL_RADIUS
    };
  }

  if (layer.type === "rectangle") {
    return {
      type: ROUNDNESS.ADAPTIVE_RADIUS
    };
  }

  return null;
};
