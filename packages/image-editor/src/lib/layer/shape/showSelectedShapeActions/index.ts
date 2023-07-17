import { Shape } from "../../../../constants";
import { EditorState, NonDeletedLayer } from "../../../../types";
import { getSelectedLayers } from "../../../scene";

/**
 * Predicate function for determining whether to show selected shape actions
 * @param editorState Editor state
 * @param layers Layers
 */
export const showSelectedShapeActions = (
  editorState: EditorState,
  layers: readonly NonDeletedLayer[]
): boolean =>
  Boolean(
    editorState.editingLayer ||
      (editorState.activeTool.type !== Shape.SELECTION &&
        editorState.activeTool.type !== Shape.ERASER &&
        editorState.activeTool.type !== Shape.HAND) ||
      getSelectedLayers(layers, editorState).length
  );
