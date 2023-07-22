import { CanvasPattern } from "../../../constants";
import { ImgEditorState } from "../../index";

export const selectPattern = (state: ImgEditorState): CanvasPattern =>
  state.root.pattern;

export const selectZoom = (state: ImgEditorState): number => state.root.zoom;
