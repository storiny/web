import { FabricObject, Group } from "fabric";

/**
 * Predicate function for determining group objects
 * @param object Object
 */
export const is_group = (object: FabricObject): object is Group =>
  object instanceof Group;
