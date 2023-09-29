import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Arrow } from "../../lib";

/**
 * Predicate function for determining arrow objects
 * @param object Object
 */
export const is_arrow_object = (object: BaseFabricObject): object is Arrow =>
  object.get("_type") === LayerType.ARROW;
