import { BaseFabricObject, Group } from "fabric";

/**
 * Predicate function for determining group objects
 * @param object Object
 */
export const isGroup = (object: BaseFabricObject): object is Group =>
  object instanceof Group;
