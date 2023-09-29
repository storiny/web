import { ActiveSelection, BaseFabricObject } from "fabric";

/**
 * Predicate function for determining active selection
 * @param object Object
 */
export const is_active_selection = (
  object: BaseFabricObject
): object is ActiveSelection => object instanceof ActiveSelection;
