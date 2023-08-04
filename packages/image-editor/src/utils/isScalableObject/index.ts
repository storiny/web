import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";

/**
 * Predicate function for determining scalable objects
 * @param object Object
 */
export const isScalableObject = (object: BaseFabricObject): boolean =>
  [LayerType.PEN, LayerType.IMAGE].includes(object.get("_type"));
