import { Layer } from "../../../types";
import { ImgEditorState } from "../../index";

export const selectLayers = (state: ImgEditorState): Layer[] =>
  state.layers.layers;

export const selectActiveLayers = (state: ImgEditorState): Layer[] =>
  state.layers.layers.filter((layer) => layer.selected);

export const selectActiveLayer = (state: ImgEditorState): Layer | null =>
  state.layers.layers.filter((layer) => layer.selected)?.[0] || null;
