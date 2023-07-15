import { getSelectedLayers } from "../../lib/scene";
import { updateFrameMembershipOfSelectedLayers } from "../frame";
import { CODES, KEYS } from "../keys";
import { getNonDeletedLayers } from "../layer";
import {
  bindOrUnbindSelectedLayers,
  isBindingEnabled,
  unbindLinearLayers
} from "../layer/binding";
import { getCommonBoundingBox } from "../layer/bounds";
import { resizeMultipleLayers } from "../layer/resizeLayers";
import { ExcalidrawLayer, NonDeleted } from "../layer/types";
import { AppState, PointerDownState } from "../types";
import { arrayToMap } from "../utils";
import { register } from "./register";

export const actionFlipHorizontal = register({
  name: "flipHorizontal",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => ({
    layers: updateFrameMembershipOfSelectedLayers(
      flipSelectedLayers(layers, appState, "horizontal"),
      appState
    ),
    appState,
    commitToHistory: true
  }),
  keyTest: (event) => event.shiftKey && event.code === CODES.H,
  contextItemLabel: "labels.flipHorizontal"
});

export const actionFlipVertical = register({
  name: "flipVertical",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => ({
    layers: updateFrameMembershipOfSelectedLayers(
      flipSelectedLayers(layers, appState, "vertical"),
      appState
    ),
    appState,
    commitToHistory: true
  }),
  keyTest: (event) =>
    event.shiftKey && event.code === CODES.V && !event[KEYS.CTRL_OR_CMD],
  contextItemLabel: "labels.flipVertical"
});

const flipSelectedLayers = (
  layers: readonly ExcalidrawLayer[],
  appState: Readonly<AppState>,
  flipDirection: "horizontal" | "vertical"
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    appState,
    {
      includeLayersInFrames: true
    }
  );

  const updatedLayers = flipLayers(selectedLayers, appState, flipDirection);

  const updatedLayersMap = arrayToMap(updatedLayers);

  return layers.map((layer) => updatedLayersMap.get(layer.id) || layer);
};

const flipLayers = (
  layers: NonDeleted<ExcalidrawLayer>[],
  appState: AppState,
  flipDirection: "horizontal" | "vertical"
): ExcalidrawLayer[] => {
  const { minX, minY, maxX, maxY } = getCommonBoundingBox(layers);

  resizeMultipleLayers(
    { originalLayers: arrayToMap(layers) } as PointerDownState,
    layers,
    "nw",
    true,
    flipDirection === "horizontal" ? maxX : minX,
    flipDirection === "horizontal" ? minY : maxY
  );

  (isBindingEnabled(appState)
    ? bindOrUnbindSelectedLayers
    : unbindLinearLayers)(layers);

  return layers;
};
