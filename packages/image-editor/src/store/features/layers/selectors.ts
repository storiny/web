import { BareLayer } from "../../../types";
import { ImgEditorState } from "../../index";

export const selectLayers = (state: ImgEditorState): BareLayer[] =>
  state.layers.layers;

export const selectActiveLayers = (state: ImgEditorState): BareLayer[] =>
  state.layers.layers.filter((layer) => layer.selected);

export const selectActiveLayer = (state: ImgEditorState): BareLayer | null =>
  state.layers.layers.filter((layer) => layer.selected)?.[0] || null;
