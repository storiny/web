import { FabricObject } from "fabric";

import { LayerType } from "../../constants";
import { Text } from "../../lib";

/**
 * Predicate function for determining text objects
 * @param object Object
 */
export const is_text_object = (object: FabricObject): object is Text =>
  object.get("_type") === LayerType.TEXT;
