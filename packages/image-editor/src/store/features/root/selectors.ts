import { CanvasPattern, Dimension } from "../../../constants";
import { ImgEditorState } from "../../index";

export const selectDimension = (state: ImgEditorState): Dimension =>
  state.root.dimension;

export const selectPattern = (state: ImgEditorState): CanvasPattern =>
  state.root.pattern;

export const selectRotation = (state: ImgEditorState): number =>
  state.root.rotation;

export const selectZoom = (state: ImgEditorState): number => state.root.zoom;
