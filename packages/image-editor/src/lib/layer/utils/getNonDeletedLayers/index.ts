import { Layer, NonDeletedLayer } from "../../../../types";

/**
 * Returns the non-deleted layers from the provided array of layers
 * @param layers Layers
 */
export const getNonDeletedLayers = (
  layers: readonly Layer[]
): readonly NonDeletedLayer[] =>
  layers.filter((layer) => !layer.isDeleted) as readonly NonDeletedLayer[];
