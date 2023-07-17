import { LayerType } from "../../../../constants";
import { Layer, PointBinding } from "../../../../types";
import { mutateLayer } from "../../mutate";
import { isBindableLayer, isBindingLayer } from "../../predicates";

/**
 * Returns new bound layers after deletion
 * @param boundLayers Bound layers
 * @param deletedLayerIds Deleted layer IDS
 */
const newBoundLayersAfterDeletion = (
  boundLayers: Layer["boundLayers"],
  deletedLayerIds: Set<Layer["id"]>
): { id: string; type: LayerType.ARROW | LayerType.TEXT }[] | null => {
  if (!boundLayers) {
    return null;
  }

  return boundLayers.filter(({ id }) => !deletedLayerIds.has(id));
};

/**
 * Returns new binding layer after deletion
 * @param binding Point binding
 * @param deletedLayerIds Deleted layer IDS
 */
const newBindingAfterDeletion = (
  binding: PointBinding | null,
  deletedLayerIds: Set<Layer["id"]>
): PointBinding | null => {
  if (binding == null || deletedLayerIds.has(binding.layerId)) {
    return null;
  }

  return binding;
};

/**
 * Fixes bindings after deletion
 * @param sceneLayers Scene layers
 * @param deletedLayers Deleted layers
 */
export const fixBindingsAfterDeletion = (
  sceneLayers: readonly Layer[],
  deletedLayers: readonly Layer[]
): void => {
  const deletedLayerIds = new Set(deletedLayers.map(({ id }) => id));
  const affectedLayers: Set<Layer["id"]> = new Set();

  deletedLayers.forEach((deletedLayer) => {
    if (isBindableLayer(deletedLayer)) {
      deletedLayer.boundLayers?.forEach((layer) => {
        if (!deletedLayerIds.has(layer.id)) {
          affectedLayers.add(layer.id);
        }
      });
    } else if (isBindingLayer(deletedLayer)) {
      if (deletedLayer.startBinding) {
        affectedLayers.add(deletedLayer.startBinding.layerId);
      }

      if (deletedLayer.endBinding) {
        affectedLayers.add(deletedLayer.endBinding.layerId);
      }
    }
  });

  sceneLayers
    .filter(({ id }) => affectedLayers.has(id))
    .forEach((layer) => {
      if (isBindableLayer(layer)) {
        mutateLayer(layer, {
          boundLayers: newBoundLayersAfterDeletion(
            layer.boundLayers,
            deletedLayerIds
          )
        });
      } else if (isBindingLayer(layer)) {
        mutateLayer(layer, {
          startBinding: newBindingAfterDeletion(
            layer.startBinding,
            deletedLayerIds
          ),
          endBinding: newBindingAfterDeletion(layer.endBinding, deletedLayerIds)
        });
      }
    });
};
