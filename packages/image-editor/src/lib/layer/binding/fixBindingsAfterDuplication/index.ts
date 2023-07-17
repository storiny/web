import { Layer, LinearLayer, PointBinding } from "../../../../types";
import { mutateLayer } from "../../mutate";
import { isBindingLayer } from "../../predicates";

/**
 * Returns new binding after layer duplication
 * @param binding Point binding
 * @param oldIdToDuplicatedId Duplication map
 */
const newBindingAfterDuplication = (
  binding: PointBinding | null,
  oldIdToDuplicatedId: Map<Layer["id"], Layer["id"]>
): PointBinding | null => {
  if (binding == null) {
    return null;
  }

  const { layerId, focus, gap } = binding;

  return {
    focus,
    gap,
    layerId: oldIdToDuplicatedId.get(layerId) ?? layerId
  };
};

/**
 * Fixes bindings after duplication, updates layers not selected to point to
 * duplicate layers and duplicated layers to point to other duplicated layers
 * @param sceneLayers Scene layers
 * @param oldLayers Old layers
 * @param oldIdToDuplicatedId Old layer ID to duplicate ID
 * @param duplicatesServeAsOld There are three copying mechanisms: Copy-paste, duplication and alt-drag.
 * Only when alt-dragging the new "duplicates" act as the "old", while
 * the "old" layers act as the "new copy" - essentially working reverse
 * to the other two.
 */
export const fixBindingsAfterDuplication = (
  sceneLayers: readonly Layer[],
  oldLayers: readonly Layer[],
  oldIdToDuplicatedId: Map<Layer["id"], Layer["id"]>,
  duplicatesServeAsOld?: "duplicatesServeAsOld" | undefined
): void => {
  // First, collect all the binding/bindable layers, so we only update
  // each once, regardless of whether they were duplicated or not
  const allBoundLayerIds: Set<Layer["id"]> = new Set();
  const allBindableLayerIds: Set<Layer["id"]> = new Set();
  const shouldReverseRoles = duplicatesServeAsOld === "duplicatesServeAsOld";

  oldLayers.forEach((oldLayer) => {
    const { boundLayers } = oldLayer;

    if (boundLayers != null && boundLayers.length > 0) {
      boundLayers.forEach((boundLayer) => {
        if (shouldReverseRoles && !oldIdToDuplicatedId.has(boundLayer.id)) {
          allBoundLayerIds.add(boundLayer.id);
        }
      });

      allBindableLayerIds.add(oldIdToDuplicatedId.get(oldLayer.id)!);
    }

    if (isBindingLayer(oldLayer)) {
      if (oldLayer.startBinding != null) {
        const { layerId } = oldLayer.startBinding;
        if (shouldReverseRoles && !oldIdToDuplicatedId.has(layerId)) {
          allBindableLayerIds.add(layerId);
        }
      }

      if (oldLayer.endBinding != null) {
        const { layerId } = oldLayer.endBinding;
        if (shouldReverseRoles && !oldIdToDuplicatedId.has(layerId)) {
          allBindableLayerIds.add(layerId);
        }
      }

      if (oldLayer.startBinding != null || oldLayer.endBinding != null) {
        allBoundLayerIds.add(oldIdToDuplicatedId.get(oldLayer.id)!);
      }
    }
  });

  // Update the linear layers
  (
    sceneLayers.filter(({ id }) => allBoundLayerIds.has(id)) as LinearLayer[]
  ).forEach((layer) => {
    const { startBinding, endBinding } = layer;
    mutateLayer(layer, {
      startBinding: newBindingAfterDuplication(
        startBinding,
        oldIdToDuplicatedId
      ),
      endBinding: newBindingAfterDuplication(endBinding, oldIdToDuplicatedId)
    });
  });

  // Update the bindable shapes
  sceneLayers
    .filter(({ id }) => allBindableLayerIds.has(id))
    .forEach((bindableLayer) => {
      const { boundLayers } = bindableLayer;
      if (boundLayers != null && boundLayers.length > 0) {
        mutateLayer(bindableLayer, {
          boundLayers: boundLayers.map((boundLayer) =>
            oldIdToDuplicatedId.has(boundLayer.id)
              ? {
                  id: oldIdToDuplicatedId.get(boundLayer.id)!,
                  type: boundLayer.type
                }
              : boundLayer
          )
        });
      }
    });
};
