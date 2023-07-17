import { Layer, NonDeleted } from "../../../../types";

/**
 * Predicate function for determining non-deleted layers
 * @param layer Layer
 */
export const isNonDeletedLayer = <T extends Layer>(
  layer: T
): layer is NonDeleted<T> => !layer.isDeleted;
