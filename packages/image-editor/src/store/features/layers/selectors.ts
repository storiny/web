import { Layer } from "../../../types";
import { CurrentLayerProps, ImgEditorState } from "../../index";

export const selectActiveLayer = (state: ImgEditorState): Layer =>
  state.layers.items.find((item) => item.id === state.layers.selected) ||
  state.layers.items[0];

export const selectLayers = (state: ImgEditorState): Layer[] =>
  state.layers.items;

export const selectActiveLayerId = (state: ImgEditorState): string | null =>
  state.layers.selected;

export const selectLayerProps = (state: ImgEditorState): CurrentLayerProps =>
  state.layers.props;
