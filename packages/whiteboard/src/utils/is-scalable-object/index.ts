import { FabricObject } from "fabric";

import { LayerType } from "../../constants";

/**
 * Predicate function for determining scalable objects
 * @param object Object
 */
export const is_scalable_object = (object: FabricObject): boolean =>
  [LayerType.PEN, LayerType.IMAGE].includes(object.get("_type"));
