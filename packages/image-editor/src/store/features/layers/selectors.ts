import { Layer } from "../../../types";
import { ImgEditorState } from "../../index";

export const selectActiveLayer = (state: ImgEditorState): Layer =>
  state.layers.layers.find((layer) => layer.id === state.layers.selected) ||
  state.layers.layers[0];

export const selectLayers = (state: ImgEditorState): Layer[] =>
  state.layers.layers;

export const selectActiveLayerId = (state: ImgEditorState): string | null =>
  state.layers.selected;
