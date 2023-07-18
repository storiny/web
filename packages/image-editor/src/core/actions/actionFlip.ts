import { getSelectedLayers } from "../../lib/scene";
import { arrayToMap } from "../../lib/utils/utils";
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
import { register } from "./register";

export const actionFlipHorizontal = register({
  name: "flipHorizontal",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    layers: updateFrameMembershipOfSelectedLayers(
      flipSelectedLayers(layers, editorState, "horizontal"),
      editorState
    ),
    editorState,
    commitToHistory: true
  }),
  keyTest: (event) => event.shiftKey && event.code === CODES.H,
  contextItemLabel: "labels.flipHorizontal"
});

export const actionFlipVertical = register({
  name: "flipVertical",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    layers: updateFrameMembershipOfSelectedLayers(
      flipSelectedLayers(layers, editorState, "vertical"),
      editorState
    ),
    editorState,
    commitToHistory: true
  }),
  keyTest: (event) =>
    event.shiftKey && event.code === CODES.V && !event[KEYS.CTRL_OR_CMD],
  contextItemLabel: "labels.flipVertical"
});

const flipSelectedLayers = (
  layers: readonly ExcalidrawLayer[],
  editorState: Readonly<AppState>,
  flipDirection: "horizontal" | "vertical"
) => {
  const selectedLayers = getSelectedLayers(
    getNonDeletedLayers(layers),
    editorState,
    {
      includeLayersInFrames: true
    }
  );

  const updatedLayers = flipLayers(selectedLayers, editorState, flipDirection);

  const updatedLayersMap = arrayToMap(updatedLayers);

  return layers.map((layer) => updatedLayersMap.get(layer.id) || layer);
};

const flipLayers = (
  layers: NonDeleted<ExcalidrawLayer>[],
  editorState: AppState,
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

  (isBindingEnabled(editorState)
    ? bindOrUnbindSelectedLayers
    : unbindLinearLayers)(layers);

  return layers;
};
