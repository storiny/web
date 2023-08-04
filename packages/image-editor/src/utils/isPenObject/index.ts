import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Pen } from "../../lib";

/**
 * Predicate function for determining pen objects
 * @param object Object
 */
export const isPenObject = (object: BaseFabricObject): object is Pen =>
  object.get("_type") === LayerType.PEN;
