import { getSelectedLayers } from "../scene";
import { UIAppState } from "../types";
import { NonDeletedExcalidrawLayer } from "./types";

export const showSelectedShapeActions = (
  appState: UIAppState,
  layers: readonly NonDeletedExcalidrawLayer[]
) =>
  Boolean(
    (!appState.viewModeEnabled &&
      appState.activeTool.type !== "custom" &&
      (appState.editingLayer ||
        (appState.activeTool.type !== "selection" &&
          appState.activeTool.type !== "eraser" &&
          appState.activeTool.type !== "hand"))) ||
      getSelectedLayers(layers, appState).length
  );
