import { MarkNonNullable } from "@storiny/types";

import { LayerType } from "../../../../constants";
import { BindableLayer, Layer } from "../../../../types";
import { isTextBindableContainer } from "../isTextBindableContainer";

/**
 * Predicate function for determining bounded text layers
 * @param layer Layer
 */
export const hasBoundTextLayer = (
  layer: Layer | null
): layer is MarkNonNullable<BindableLayer, "boundLayers"> =>
  isTextBindableContainer(layer) &&
  !!layer.boundLayers?.some(({ type }) => type === LayerType.TEXT);
