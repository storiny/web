import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Image } from "../../lib";

/**
 * Predicate function for determining image objects
 * @param object Object
 */
export const isImageObject = (object: BaseFabricObject): object is Image =>
  object.get("_type") === LayerType.IMAGE;
