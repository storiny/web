import { BindableLayer, NonDeleted } from "../../../../types";
import { getLayerAtPosition } from "../../../scene";
import Scene from "../../../scene/scene/Scene";
import { bindingBorderTest } from "../../collision";
import { isBindableLayer } from "../../predicates";

/**
 * Returns the hovered layer for binding
 * @param pointerCoords Pointer coordinates
 * @param scene Scene
 */
export const getHoveredLayerForBinding = (
  pointerCoords: {
    x: number;
    y: number;
  },
  scene: Scene
): NonDeleted<BindableLayer> | null =>
  getLayerAtPosition(
    scene.getNonDeletedLayers(),
    (layer) =>
      isBindableLayer(layer, false) && bindingBorderTest(layer, pointerCoords)
  ) as NonDeleted<BindableLayer> | null;
