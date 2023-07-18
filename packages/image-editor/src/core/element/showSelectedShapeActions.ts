import { getSelectedLayers } from "../../lib/scene";
import { UIAppState } from "../types";
import { NonDeletedExcalidrawLayer } from "./types";

export const showSelectedShapeActions = (
  editorState: UIAppState,
  layers: readonly NonDeletedExcalidrawLayer[]
) =>
  Boolean(
    (!editorState.viewModeEnabled &&
      editorState.activeTool.type !== "custom" &&
      (editorState.editingLayer ||
        (editorState.activeTool.type !== "selection" &&
          editorState.activeTool.type !== "eraser" &&
          editorState.activeTool.type !== "hand"))) ||
      getSelectedLayers(layers, editorState).length
  );
