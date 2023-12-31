import { FabricObject } from "fabric";

import { is_group } from "../is-group";

/**
 * Predicate function for determining interactive objects
 * @param object Object
 */
export const is_interactive_object = (object: FabricObject): boolean =>
  !object.group &&
  !is_group(object) &&
  object.get("interactive") === true &&
  object.visible &&
  !object.get("locked");
