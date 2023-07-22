import { Layer } from "../../../types";
import { ImgEditorState } from "../../index";

export const selectLayers = (state: ImgEditorState): Layer[] =>
  state.layers.layers;

export const selectActiveLayers = (state: ImgEditorState): Layer[] =>
  state.layers.layers.filter((layer) => layer.selected);

export const selectActiveLayerRotation = (
  state: ImgEditorState
): Pick<Layer, "id" | "rotation"> | undefined => {
  const [activeLayer] = selectActiveLayers(state);

  if (!activeLayer) {
    return undefined;
  }

  return {
    id: activeLayer.id,
    rotation: activeLayer.rotation
  };
};

export const selectActiveLayerSize = (
  state: ImgEditorState
): Pick<Layer, "id" | "height" | "width" | "scaleX" | "scaleY"> | undefined => {
  const [activeLayer] = selectActiveLayers(state);

  if (!activeLayer) {
    return undefined;
  }

  return {
    id: activeLayer.id,
    height: activeLayer.height,
    width: activeLayer.width,
    scaleY: activeLayer.scaleY,
    scaleX: activeLayer.scaleX
  };
};

export const selectActiveLayerPosition = (
  state: ImgEditorState
): Pick<Layer, "id" | "x" | "y"> | undefined => {
  const [activeLayer] = selectActiveLayers(state);

  if (!activeLayer) {
    return undefined;
  }

  return {
    id: activeLayer.id,
    x: activeLayer.x,
    y: activeLayer.y
  };
};
