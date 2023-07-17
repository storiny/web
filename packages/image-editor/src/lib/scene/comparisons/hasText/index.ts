import { LayerType } from "../../../../constants";

/**
 * Predicate function for determining whether a layer has text
 * @param type Layer type
 */
export const hasText = (type: LayerType): boolean => type === LayerType.TEXT;
