import { Layer, NonDeleted } from "../../../../types";
import Scene from "../../../scene/scene/Scene";

/**
 * Returns non-deleted layers from the scene
 * @param scene Scene
 * @param ids Layer IDS
 */
export const getNonDeletedLayersFromScene = (
  scene: Scene,
  ids: readonly Layer["id"][]
): NonDeleted<Layer>[] => {
  const result: NonDeleted<Layer>[] = [];

  ids.forEach((id) => {
    const layer = scene.getNonDeletedLayer(id);
    if (layer != null) {
      result.push(layer);
    }
  });

  return result;
};
