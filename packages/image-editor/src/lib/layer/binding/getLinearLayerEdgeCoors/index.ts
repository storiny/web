import { LinearLayer, NonDeleted } from "../../../../types";
import { LinearLayerEditor } from "../../linearLayerEditor";

/**
 * Returns the edge coordinates of a linear layer
 * @param linearLayer Linear layer
 * @param startOrEnd Start or end enum
 */
export const getLinearLayerEdgeCoors = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end"
): { x: number; y: number } =>
  tupleToCoors(
    LinearLayerEditor.getPointAtIndexGlobalCoordinates(
      linearLayer,
      startOrEnd === "start" ? 0 : -1
    )
  );
