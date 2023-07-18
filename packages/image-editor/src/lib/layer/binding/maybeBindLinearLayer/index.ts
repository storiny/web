import { LinearLayer, NonDeleted, RootState } from "../../../../types";
import { Scene } from "../../../scene";
import { bindLinearLayer } from "../bindLinearLayer";
import { getHoveredLayerForBinding } from "../getHoveredLayerForBinding";
import { isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge } from "../isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge";

/**
 * Tries to bind linear layer
 * @param linearLayer Linear layer
 * @param editorState Editor state
 * @param scene Scene
 * @param pointerCoords Pointer coordinates
 */
export const maybeBindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  editorState: RootState,
  scene: Scene,
  pointerCoords: { x: number; y: number }
): void => {
  if (editorState.startBoundLayer != null) {
    bindLinearLayer(linearLayer, editorState.startBoundLayer, "start");
  }

  const hoveredLayer = getHoveredLayerForBinding(pointerCoords, scene);

  if (
    hoveredLayer != null &&
    !isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge(
      linearLayer,
      hoveredLayer,
      "end"
    )
  ) {
    bindLinearLayer(linearLayer, hoveredLayer, "end");
  }
};
