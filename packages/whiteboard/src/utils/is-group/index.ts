import { BaseFabricObject, Group } from "fabric";

/**
 * Predicate function for determining group objects
 * @param object Object
 */
export const is_group = (object: BaseFabricObject): object is Group =>
  object instanceof Group;
