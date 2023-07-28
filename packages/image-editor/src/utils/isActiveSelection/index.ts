import { ActiveSelection, BaseFabricObject } from "fabric";

/**
 * Predicate function for determining active selection
 * @param object Object
 */
export const isActiveSelection = (
  object: BaseFabricObject
): object is ActiveSelection => object instanceof ActiveSelection;
