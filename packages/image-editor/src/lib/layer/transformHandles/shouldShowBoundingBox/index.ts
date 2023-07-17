import { EditorState, NonDeletedLayer } from "../../../../types";
import { isLinearLayer } from "../../predicates";

/**
 * Predicate function for determining whether to show bounding box
 * @param layers Layers
 * @param editorState Editor state
 */
export const shouldShowBoundingBox = (
  layers: NonDeletedLayer[],
  editorState: EditorState
): boolean => {
  if (editorState.editingLinearLayer) {
    return false;
  }

  if (layers.length > 1) {
    return true;
  }

  const layer = layers[0];

  if (!isLinearLayer(layer)) {
    return true;
  }

  return layer.points.length > 2;
};
