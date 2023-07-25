import { BaseFabricObject } from "fabric";

import { isGroup } from "../isGroup";

/**
 * Predicate function for determining interactive objects
 * @param object Object
 */
export const isInteractiveObject = (object: BaseFabricObject): boolean =>
  !object.group &&
  !isGroup(object) &&
  object.get("interactive") === true &&
  object.visible &&
  !object.get("locked");
