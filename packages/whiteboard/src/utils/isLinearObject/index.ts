import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Arrow, Line } from "../../lib";

/**
 * Predicate function for determining linear objects
 * @param object Object
 */
export const isLinearObject = (
  object: BaseFabricObject
): object is Line | Arrow =>
  [LayerType.LINE, LayerType.ARROW].includes(object.get("_type"));
