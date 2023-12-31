import { FabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Pen } from "../../lib";

/**
 * Predicate function for determining pen objects
 * @param object Object
 */
export const is_pen_object = (object: FabricObject): object is Pen =>
  object.get("_type") === LayerType.PEN;
