import { LayerType } from "../../../../constants";
import {
  BindableLayer,
  LinearLayer,
  NonDeleted,
  PointBinding
} from "../../../../types";
import {
  determineFocusDistance,
  distanceToBindableLayer
} from "../../collision";
import { LinearLayerEditor } from "../../linearLayerEditor";
import { mutateLayer } from "../../mutate";
import {arrayToMap} from "../../../utils";

/**
 * Returns the focus and gap values for layer
 * @param linearLayer Linear layer
 * @param hoveredLayer Hovered layer
 * @param startOrEnd Start or end enum
 */
const calculateFocusAndGap = (
  linearLayer: NonDeleted<LinearLayer>,
  hoveredLayer: BindableLayer,
  startOrEnd: "start" | "end"
): { focus: number; gap: number } => {
  const direction = startOrEnd === "start" ? -1 : 1;
  const edgePointIndex = direction === -1 ? 0 : linearLayer.points.length - 1;
  const adjacentPointIndex = edgePointIndex - direction;
  const edgePoint = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
    linearLayer,
    edgePointIndex
  );
  const adjacentPoint = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
    linearLayer,
    adjacentPointIndex
  );

  return {
    focus: determineFocusDistance(hoveredLayer, adjacentPoint, edgePoint),
    gap: Math.max(1, distanceToBindableLayer(hoveredLayer, edgePoint))
  };
};

/**
 * Binds a linear layer
 * @param linearLayer Linear layer
 * @param hoveredLayer Hovered layer
 * @param startOrEnd Start or end enum
 */
export const bindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  hoveredLayer: BindableLayer,
  startOrEnd: "start" | "end"
): void => {
  mutateLayer(linearLayer, {
    [startOrEnd === "start" ? "startBinding" : "endBinding"]: {
      layerId: hoveredLayer.id,
      ...calculateFocusAndGap(linearLayer, hoveredLayer, startOrEnd)
    } as PointBinding
  });

  const boundLayersMap = arrayToMap(hoveredLayer.boundLayers || []);

  if (!boundLayersMap.has(linearLayer.id)) {
    mutateLayer(hoveredLayer, {
      boundLayers: (hoveredLayer.boundLayers || []).concat({
        id: linearLayer.id,
        type: LayerType.ARROW
      })
    });
  }
};
