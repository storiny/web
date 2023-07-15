import { PRECEDING_ELEMENT_KEY } from "../../constants";
import { ExcalidrawLayer } from "../../layer/types";
import { AppState } from "../../types";
import { arrayToMapWithIndex } from "../../utils";

export type ReconciledLayers = readonly ExcalidrawLayer[] & {
  _brand: "reconciledLayers";
};

export type BroadcastedExcalidrawLayer = ExcalidrawLayer & {
  [PRECEDING_ELEMENT_KEY]?: string;
};

const shouldDiscardRemoteLayer = (
  localAppState: AppState,
  local: ExcalidrawLayer | undefined,
  remote: BroadcastedExcalidrawLayer
): boolean => {
  if (
    local &&
    // local layer is being edited
    (local.id === localAppState.editingLayer?.id ||
      local.id === localAppState.resizingLayer?.id ||
      local.id === localAppState.draggingLayer?.id ||
      // local layer is newer
      local.version > remote.version ||
      // resolve conflicting edits deterministically by taking the one with
      // the lowest versionNonce
      (local.version === remote.version &&
        local.versionNonce < remote.versionNonce))
  ) {
    return true;
  }
  return false;
};

export const reconcileLayers = (
  localLayers: readonly ExcalidrawLayer[],
  remoteLayers: readonly BroadcastedExcalidrawLayer[],
  localAppState: AppState
): ReconciledLayers => {
  const localLayersData = arrayToMapWithIndex<ExcalidrawLayer>(localLayers);

  const reconciledLayers: ExcalidrawLayer[] = localLayers.slice();

  const duplicates = new WeakMap<ExcalidrawLayer, true>();

  let cursor = 0;
  let offset = 0;

  let remoteLayerIdx = -1;
  for (const remoteLayer of remoteLayers) {
    remoteLayerIdx++;

    const local = localLayersData.get(remoteLayer.id);

    if (shouldDiscardRemoteLayer(localAppState, local?.[0], remoteLayer)) {
      if (remoteLayer[PRECEDING_ELEMENT_KEY]) {
        delete remoteLayer[PRECEDING_ELEMENT_KEY];
      }

      continue;
    }

    // Mark duplicate for removal as it'll be replaced with the remote layer
    if (local) {
      // Unless the remote and local layers are the same layer in which case
      // we need to keep it as we'd otherwise discard it from the resulting
      // array.
      if (local[0] === remoteLayer) {
        continue;
      }
      duplicates.set(local[0], true);
    }

    // parent may not be defined in case the remote client is running an older
    // excalidraw version
    const parent =
      remoteLayer[PRECEDING_ELEMENT_KEY] ||
      remoteLayers[remoteLayerIdx - 1]?.id ||
      null;

    if (parent != null) {
      delete remoteLayer[PRECEDING_ELEMENT_KEY];

      // ^ indicates the layer is the first in layers array
      if (parent === "^") {
        offset++;
        if (cursor === 0) {
          reconciledLayers.unshift(remoteLayer);
          localLayersData.set(remoteLayer.id, [remoteLayer, cursor - offset]);
        } else {
          reconciledLayers.splice(cursor + 1, 0, remoteLayer);
          localLayersData.set(remoteLayer.id, [
            remoteLayer,
            cursor + 1 - offset
          ]);
          cursor++;
        }
      } else {
        let idx = localLayersData.has(parent)
          ? localLayersData.get(parent)![1]
          : null;
        if (idx != null) {
          idx += offset;
        }
        if (idx != null && idx >= cursor) {
          reconciledLayers.splice(idx + 1, 0, remoteLayer);
          offset++;
          localLayersData.set(remoteLayer.id, [remoteLayer, idx + 1 - offset]);
          cursor = idx + 1;
        } else if (idx != null) {
          reconciledLayers.splice(cursor + 1, 0, remoteLayer);
          offset++;
          localLayersData.set(remoteLayer.id, [
            remoteLayer,
            cursor + 1 - offset
          ]);
          cursor++;
        } else {
          reconciledLayers.push(remoteLayer);
          localLayersData.set(remoteLayer.id, [
            remoteLayer,
            reconciledLayers.length - 1 - offset
          ]);
        }
      }
      // no parent z-index information, local layer exists → replace in place
    } else if (local) {
      reconciledLayers[local[1]] = remoteLayer;
      localLayersData.set(remoteLayer.id, [remoteLayer, local[1]]);
      // otherwise push to the end
    } else {
      reconciledLayers.push(remoteLayer);
      localLayersData.set(remoteLayer.id, [
        remoteLayer,
        reconciledLayers.length - 1 - offset
      ]);
    }
  }

  const ret: readonly ExcalidrawLayer[] = reconciledLayers.filter(
    (layer) => !duplicates.has(layer)
  );

  return ret as ReconciledLayers;
};
