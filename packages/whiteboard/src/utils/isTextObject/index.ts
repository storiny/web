import { BaseFabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Text } from "../../lib";

/**
 * Predicate function for determining text objects
 * @param object Object
 */
export const isTextObject = (object: BaseFabricObject): object is Text =>
  object.get("_type") === LayerType.TEXT;
