import { isSomeLayerSelected } from "../../lib/scene";
import {
  excludeLayersInFramesFromSelection,
  getSelectedLayers
} from "../../lib/scene/selection";
import { DuplicateIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { GRID_SIZE } from "../constants";
import { bindLayersToFramesAfterDuplication, getFrameLayers } from "../frame";
import {
  getLayersInGroup,
  getSelectedGroupForLayer,
  selectGroupsForSelectedLayers
} from "../groups";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { duplicateLayer, getNonDeletedLayers } from "../layer";
import { fixBindingsAfterDuplication } from "../layer/binding";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import { normalizeLayerOrder } from "../layer/sortLayers";
import {
  bindTextToShapeAfterDuplication,
  getBoundTextLayer
} from "../layer/textLayer";
import { isBoundToContainer, isFrameLayer } from "../layer/typeChecks";
import { ExcalidrawLayer } from "../layer/types";
import { AppState } from "../types";
import { arrayToMap, getShortcutKey } from "../utils";
import { register } from "./register";
import { ActionResult } from "./types";

export const actionDuplicateSelection = register({
  name: "duplicateSelection",
  trackEvent: { category: "layer" },
  perform: (layers, appState) => {
    // duplicate selected point(s) if editing a line
    if (appState.editingLinearLayer) {
      const ret = LinearLayerEditor.duplicateSelectedPoints(appState);

      if (!ret) {
        return false;
      }

      return {
        layers,
        appState: ret.appState,
        commitToHistory: true
      };
    }

    return {
      ...duplicateLayers(layers, appState),
      commitToHistory: true
    };
  },
  contextItemLabel: "labels.duplicateSelection",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.D,
  PanelComponent: ({ layers, appState, updateData }) => (
    <ToolButton
      aria-label={t("labels.duplicateSelection")}
      icon={DuplicateIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.duplicateSelection")} — ${getShortcutKey(
        "CtrlOrCmd+D"
      )}`}
      type="button"
      visible={isSomeLayerSelected(getNonDeletedLayers(layers), appState)}
    />
  )
});

const duplicateLayers = (
  layers: readonly ExcalidrawLayer[],
  appState: AppState
): Partial<ActionResult> => {
  // ---------------------------------------------------------------------------

  // step (1)

  const sortedLayers = normalizeLayerOrder(layers);
  const groupIdMap = new Map();
  const newLayers: ExcalidrawLayer[] = [];
  const oldLayers: ExcalidrawLayer[] = [];
  const oldIdToDuplicatedId = new Map();

  const duplicateAndOffsetLayer = (layer: ExcalidrawLayer) => {
    const newLayer = duplicateLayer(
      appState.editingGroupId,
      groupIdMap,
      layer,
      {
        x: layer.x + GRID_SIZE / 2,
        y: layer.y + GRID_SIZE / 2
      }
    );
    oldIdToDuplicatedId.set(layer.id, newLayer.id);
    oldLayers.push(layer);
    newLayers.push(newLayer);
    return newLayer;
  };

  const idsOfLayersToDuplicate = arrayToMap(
    getSelectedLayers(sortedLayers, appState, {
      includeBoundTextLayer: true,
      includeLayersInFrames: true
    })
  );

  // Ids of layers that have already been processed so we don't push them
  // into the array twice if we end up backtracking when retrieving
  // discontiguous group of layers (can happen due to a bug, or in edge
  // cases such as a group containing deleted layers which were not selected).
  //
  // This is not enough to prevent duplicates, so we do a second loop afterwards
  // to remove them.
  //
  // For convenience we mark even the newly created ones even though we don't
  // loop over them.
  const processedIds = new Map<ExcalidrawLayer["id"], true>();

  const markAsProcessed = (layers: ExcalidrawLayer[]) => {
    for (const layer of layers) {
      processedIds.set(layer.id, true);
    }
    return layers;
  };

  const layersWithClones: ExcalidrawLayer[] = [];

  let index = -1;

  while (++index < sortedLayers.length) {
    const layer = sortedLayers[index];

    if (processedIds.get(layer.id)) {
      continue;
    }

    const boundTextLayer = getBoundTextLayer(layer);
    const isLayerAFrame = isFrameLayer(layer);

    if (idsOfLayersToDuplicate.get(layer.id)) {
      // if a group or a container/bound-text or frame, duplicate atomically
      if (layer.groupIds.length || boundTextLayer || isLayerAFrame) {
        const groupId = getSelectedGroupForLayer(appState, layer);
        if (groupId) {
          // TODO:
          // remove `.flatMap...`
          // if the layers in a frame are grouped when the frame is grouped
          const groupLayers = getLayersInGroup(sortedLayers, groupId).flatMap(
            (layer) =>
              isFrameLayer(layer)
                ? [...getFrameLayers(layers, layer.id), layer]
                : [layer]
          );

          layersWithClones.push(
            ...markAsProcessed([
              ...groupLayers,
              ...groupLayers.map((layer) => duplicateAndOffsetLayer(layer))
            ])
          );
          continue;
        }
        if (boundTextLayer) {
          layersWithClones.push(
            ...markAsProcessed([
              layer,
              boundTextLayer,
              duplicateAndOffsetLayer(layer),
              duplicateAndOffsetLayer(boundTextLayer)
            ])
          );
          continue;
        }
        if (isLayerAFrame) {
          const layersInFrame = getFrameLayers(sortedLayers, layer.id);

          layersWithClones.push(
            ...markAsProcessed([
              ...layersInFrame,
              layer,
              ...layersInFrame.map((e) => duplicateAndOffsetLayer(e)),
              duplicateAndOffsetLayer(layer)
            ])
          );

          continue;
        }
      }
      // since layers in frames have a lower z-index than the frame itself,
      // they will be looped first and if their frames are selected as well,
      // they will have been copied along with the frame atomically in the
      // above branch, so we must skip those layers here
      //
      // now, for layers do not belong any frames or layers whose frames
      // are selected (or layers that are left out from the above
      // steps for whatever reason) we (should at least) duplicate them here
      if (!layer.frameId || !idsOfLayersToDuplicate.has(layer.frameId)) {
        layersWithClones.push(
          ...markAsProcessed([layer, duplicateAndOffsetLayer(layer)])
        );
      }
    } else {
      layersWithClones.push(...markAsProcessed([layer]));
    }
  }

  // step (2)

  // second pass to remove duplicates. We loop from the end as it's likelier
  // that the last layers are in the correct order (contiguous or otherwise).
  // Thus we need to reverse as the last step (3).

  const finalLayersReversed: ExcalidrawLayer[] = [];

  const finalLayerIds = new Map<ExcalidrawLayer["id"], true>();
  index = layersWithClones.length;

  while (--index >= 0) {
    const layer = layersWithClones[index];
    if (!finalLayerIds.get(layer.id)) {
      finalLayerIds.set(layer.id, true);
      finalLayersReversed.push(layer);
    }
  }

  // step (3)

  const finalLayers = finalLayersReversed.reverse();

  // ---------------------------------------------------------------------------

  bindTextToShapeAfterDuplication(
    layersWithClones,
    oldLayers,
    oldIdToDuplicatedId
  );
  fixBindingsAfterDuplication(layersWithClones, oldLayers, oldIdToDuplicatedId);
  bindLayersToFramesAfterDuplication(
    finalLayers,
    oldLayers,
    oldIdToDuplicatedId
  );

  const nextLayersToSelect = excludeLayersInFramesFromSelection(newLayers);

  return {
    layers: finalLayers,
    appState: selectGroupsForSelectedLayers(
      {
        ...appState,
        selectedGroupIds: {},
        selectedLayerIds: nextLayersToSelect.reduce(
          (acc: Record<ExcalidrawLayer["id"], true>, layer) => {
            if (!isBoundToContainer(layer)) {
              acc[layer.id] = true;
            }
            return acc;
          },
          {}
        )
      },
      getNonDeletedLayers(finalLayers),
      appState
    )
  };
};
