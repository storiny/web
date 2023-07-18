import { getLayerAtPosition } from "../../lib/scene";
import Scene from "../../lib/scene/scene/Scene";
import { arrayToMap, tupleToCoors } from "../../lib/utils/utils";
import { KEYS } from "../keys";
import { AppState } from "../types";
import {
  bindingBorderTest,
  determineFocusDistance,
  determineFocusPoint,
  distanceToBindableLayer,
  intersectLayerWithLine,
  maxBindingGap
} from "./collision";
import { LinearLayerEditor } from "./linearLayerEditor";
import { mutateLayer } from "./mutateLayer";
import { getBoundTextLayer, handleBindTextResize } from "./textLayer";
import { isBindableLayer, isBindingLayer, isLinearLayer } from "./typeChecks";
import {
  ExcalidrawBindableLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  NonDeleted,
  NonDeletedExcalidrawLayer,
  PointBinding
} from "./types";

export type SuggestedBinding =
  | NonDeleted<ExcalidrawBindableLayer>
  | SuggestedPointBinding;

export type SuggestedPointBinding = [
  NonDeleted<ExcalidrawLinearLayer>,
  "start" | "end" | "both",
  NonDeleted<ExcalidrawBindableLayer>
];

export const shouldEnableBindingForPointerEvent = (
  event: React.PointerEvent<HTMLLayer>
) => !event[KEYS.CTRL_OR_CMD];

export const isBindingEnabled = (editorState: AppState): boolean =>
  editorState.isBindingEnabled;

const getNonDeletedLayers = (
  scene: Scene,
  ids: readonly ExcalidrawLayer["id"][]
): NonDeleted<ExcalidrawLayer>[] => {
  const result: NonDeleted<ExcalidrawLayer>[] = [];
  ids.forEach((id) => {
    const layer = scene.getNonDeletedLayer(id);
    if (layer != null) {
      result.push(layer);
    }
  });
  return result;
};

export const bindOrUnbindLinearLayer = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  startBindingLayer: ExcalidrawBindableLayer | null | "keep",
  endBindingLayer: ExcalidrawBindableLayer | null | "keep"
): void => {
  const boundToLayerIds: Set<ExcalidrawBindableLayer["id"]> = new Set();
  const unboundFromLayerIds: Set<ExcalidrawBindableLayer["id"]> = new Set();
  bindOrUnbindLinearLayerEdge(
    linearLayer,
    startBindingLayer,
    endBindingLayer,
    "start",
    boundToLayerIds,
    unboundFromLayerIds
  );
  bindOrUnbindLinearLayerEdge(
    linearLayer,
    endBindingLayer,
    startBindingLayer,
    "end",
    boundToLayerIds,
    unboundFromLayerIds
  );

  const onlyUnbound = Array.from(unboundFromLayerIds).filter(
    (id) => !boundToLayerIds.has(id)
  );

  getNonDeletedLayers(Scene.getScene(linearLayer)!, onlyUnbound).forEach(
    (layer) => {
      mutateLayer(layer, {
        boundLayers: layer.boundLayers?.filter(
          (layer) => layer.type !== "arrow" || layer.id !== linearLayer.id
        )
      });
    }
  );
};

const bindOrUnbindLinearLayerEdge = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  bindableLayer: ExcalidrawBindableLayer | null | "keep",
  otherEdgeBindableLayer: ExcalidrawBindableLayer | null | "keep",
  startOrEnd: "start" | "end",
  // Is mutated
  boundToLayerIds: Set<ExcalidrawBindableLayer["id"]>,
  // Is mutated
  unboundFromLayerIds: Set<ExcalidrawBindableLayer["id"]>
): void => {
  if (bindableLayer !== "keep") {
    if (bindableLayer != null) {
      // Don't bind if we're trying to bind or are already bound to the same
      // layer on the other edge already ("start" edge takes precedence).
      if (
        otherEdgeBindableLayer == null ||
        (otherEdgeBindableLayer === "keep"
          ? !isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge(
              linearLayer,
              bindableLayer,
              startOrEnd
            )
          : startOrEnd === "start" ||
            otherEdgeBindableLayer.id !== bindableLayer.id)
      ) {
        bindLinearLayer(linearLayer, bindableLayer, startOrEnd);
        boundToLayerIds.add(bindableLayer.id);
      }
    } else {
      const unbound = unbindLinearLayer(linearLayer, startOrEnd);
      if (unbound != null) {
        unboundFromLayerIds.add(unbound);
      }
    }
  }
};

export const bindOrUnbindSelectedLayers = (
  layers: NonDeleted<ExcalidrawLayer>[]
): void => {
  layers.forEach((layer) => {
    if (isBindingLayer(layer)) {
      bindOrUnbindLinearLayer(
        layer,
        getEligibleLayerForBindingLayer(layer, "start"),
        getEligibleLayerForBindingLayer(layer, "end")
      );
    } else if (isBindableLayer(layer)) {
      maybeBindBindableLayer(layer);
    }
  });
};

const maybeBindBindableLayer = (
  bindableLayer: NonDeleted<ExcalidrawBindableLayer>
): void => {
  getEligibleLayersForBindableLayerAndWhere(bindableLayer).forEach(
    ([linearLayer, where]) =>
      bindOrUnbindLinearLayer(
        linearLayer,
        where === "end" ? "keep" : bindableLayer,
        where === "start" ? "keep" : bindableLayer
      )
  );
};

export const maybeBindLinearLayer = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  editorState: AppState,
  scene: Scene,
  pointerCoords: { x: number; y: number }
): void => {
  if (editorState.startBoundLayer != null) {
    bindLinearLayer(linearLayer, editorState.startBoundLayer, "start");
  }
  const hoveredLayer = getHoveredLayerForBinding(pointerCoords, scene);
  if (
    hoveredLayer != null &&
    !isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge(
      linearLayer,
      hoveredLayer,
      "end"
    )
  ) {
    bindLinearLayer(linearLayer, hoveredLayer, "end");
  }
};

const bindLinearLayer = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  hoveredLayer: ExcalidrawBindableLayer,
  startOrEnd: "start" | "end"
): void => {
  mutateLayer(linearLayer, {
    [startOrEnd === "start" ? "startBinding" : "endBinding"]: {
      layerId: hoveredLayer.id,
      ...calculateFocusAndGap(linearLayer, hoveredLayer, startOrEnd)
    } as PointBinding
  });

  const boundLayersMap = arrayToMap(hoveredLayer.boundLayers || []);
  if (!boundLayersMap.has(linearLayer.id)) {
    mutateLayer(hoveredLayer, {
      boundLayers: (hoveredLayer.boundLayers || []).concat({
        id: linearLayer.id,
        type: "arrow"
      })
    });
  }
};

// Don't bind both ends of a simple segment
const isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  bindableLayer: ExcalidrawBindableLayer,
  startOrEnd: "start" | "end"
): boolean => {
  const otherBinding =
    linearLayer[startOrEnd === "start" ? "endBinding" : "startBinding"];
  return isLinearLayerSimpleAndAlreadyBound(
    linearLayer,
    otherBinding?.layerId,
    bindableLayer
  );
};

export const isLinearLayerSimpleAndAlreadyBound = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  alreadyBoundToId: ExcalidrawBindableLayer["id"] | undefined,
  bindableLayer: ExcalidrawBindableLayer
): boolean =>
  alreadyBoundToId === bindableLayer.id && linearLayer.points.length < 3;

export const unbindLinearLayers = (
  layers: NonDeleted<ExcalidrawLayer>[]
): void => {
  layers.forEach((layer) => {
    if (isBindingLayer(layer)) {
      bindOrUnbindLinearLayer(layer, null, null);
    }
  });
};

const unbindLinearLayer = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  startOrEnd: "start" | "end"
): ExcalidrawBindableLayer["id"] | null => {
  const field = startOrEnd === "start" ? "startBinding" : "endBinding";
  const binding = linearLayer[field];
  if (binding == null) {
    return null;
  }
  mutateLayer(linearLayer, { [field]: null });
  return binding.layerId;
};

export const getHoveredLayerForBinding = (
  pointerCoords: {
    x: number;
    y: number;
  },
  scene: Scene
): NonDeleted<ExcalidrawBindableLayer> | null => {
  const hoveredLayer = getLayerAtPosition(
    scene.getNonDeletedLayers(),
    (layer) =>
      isBindableLayer(layer, false) && bindingBorderTest(layer, pointerCoords)
  );
  return hoveredLayer as NonDeleted<ExcalidrawBindableLayer> | null;
};

const calculateFocusAndGap = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  hoveredLayer: ExcalidrawBindableLayer,
  startOrEnd: "start" | "end"
): { focus: number; gap: number } => {
  const direction = startOrEnd === "start" ? -1 : 1;
  const edgePointIndex = direction === -1 ? 0 : linearLayer.points.length - 1;
  const adjacentPointIndex = edgePointIndex - direction;
  const edgePoint = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
    linearLayer,
    edgePointIndex
  );
  const adjacentPoint = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
    linearLayer,
    adjacentPointIndex
  );
  return {
    focus: determineFocusDistance(hoveredLayer, adjacentPoint, edgePoint),
    gap: Math.max(1, distanceToBindableLayer(hoveredLayer, edgePoint))
  };
};

// Supports translating, rotating and scaling `changedLayer` with bound
// linear layers.
// Because scaling involves moving the focus points as well, it is
// done before the `changedLayer` is updated, and the `newSize` is passed
// in explicitly.
export const updateBoundLayers = (
  changedLayer: NonDeletedExcalidrawLayer,
  options?: {
    newSize?: { height: number; width: number };
    simultaneouslyUpdated?: readonly ExcalidrawLayer[];
  }
) => {
  const boundLinearLayers = (changedLayer.boundLayers ?? []).filter(
    (el) => el.type === "arrow"
  );
  if (boundLinearLayers.length === 0) {
    return;
  }
  const { newSize, simultaneouslyUpdated } = options ?? {};
  const simultaneouslyUpdatedLayerIds = getSimultaneouslyUpdatedLayerIds(
    simultaneouslyUpdated
  );

  getNonDeletedLayers(
    Scene.getScene(changedLayer)!,
    boundLinearLayers.map((el) => el.id)
  ).forEach((layer) => {
    if (!isLinearLayer(layer)) {
      return;
    }

    const bindableLayer = changedLayer as ExcalidrawBindableLayer;
    // In case the boundLayers are stale
    if (!doesNeedUpdate(layer, bindableLayer)) {
      return;
    }
    const startBinding = maybeCalculateNewGapWhenScaling(
      bindableLayer,
      layer.startBinding,
      newSize
    );
    const endBinding = maybeCalculateNewGapWhenScaling(
      bindableLayer,
      layer.endBinding,
      newSize
    );
    // `linearLayer` is being moved/scaled already, just update the binding
    if (simultaneouslyUpdatedLayerIds.has(layer.id)) {
      mutateLayer(layer, { startBinding, endBinding });
      return;
    }
    updateBoundPoint(
      layer,
      "start",
      startBinding,
      changedLayer as ExcalidrawBindableLayer
    );
    updateBoundPoint(
      layer,
      "end",
      endBinding,
      changedLayer as ExcalidrawBindableLayer
    );
    const boundText = getBoundTextLayer(layer);
    if (boundText) {
      handleBindTextResize(layer, false);
    }
  });
};

const doesNeedUpdate = (
  boundLayer: NonDeleted<ExcalidrawLinearLayer>,
  changedLayer: ExcalidrawBindableLayer
) =>
  boundLayer.startBinding?.layerId === changedLayer.id ||
  boundLayer.endBinding?.layerId === changedLayer.id;

const getSimultaneouslyUpdatedLayerIds = (
  simultaneouslyUpdated: readonly ExcalidrawLayer[] | undefined
): Set<ExcalidrawLayer["id"]> =>
  new Set((simultaneouslyUpdated || []).map((layer) => layer.id));

const updateBoundPoint = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  startOrEnd: "start" | "end",
  binding: PointBinding | null | undefined,
  changedLayer: ExcalidrawBindableLayer
): void => {
  if (
    binding == null ||
    // We only need to update the other end if this is a 2 point line layer
    (binding.layerId !== changedLayer.id && linearLayer.points.length > 2)
  ) {
    return;
  }
  const bindingLayer = Scene.getScene(linearLayer)!.getLayer(
    binding.layerId
  ) as ExcalidrawBindableLayer | null;
  if (bindingLayer == null) {
    // We're not cleaning up after deleted layers atm., so handle this case
    return;
  }
  const direction = startOrEnd === "start" ? -1 : 1;
  const edgePointIndex = direction === -1 ? 0 : linearLayer.points.length - 1;
  const adjacentPointIndex = edgePointIndex - direction;
  const adjacentPoint = LinearLayerEditor.getPointAtIndexGlobalCoordinates(
    linearLayer,
    adjacentPointIndex
  );
  const focusPointAbsolute = determineFocusPoint(
    bindingLayer,
    binding.focus,
    adjacentPoint
  );
  let newEdgePoint;
  // The linear layer was not originally pointing inside the bound shape,
  // we can point directly at the focus point
  if (binding.gap === 0) {
    newEdgePoint = focusPointAbsolute;
  } else {
    const intersections = intersectLayerWithLine(
      bindingLayer,
      adjacentPoint,
      focusPointAbsolute,
      binding.gap
    );
    if (intersections.length === 0) {
      // This should never happen, since focusPoint should always be
      // inside the layer, but just in case, bail out
      newEdgePoint = focusPointAbsolute;
    } else {
      // Guaranteed to intersect because focusPoint is always inside the shape
      newEdgePoint = intersections[0];
    }
  }
  LinearLayerEditor.movePoints(
    linearLayer,
    [
      {
        index: edgePointIndex,
        point: LinearLayerEditor.pointFromAbsoluteCoords(
          linearLayer,
          newEdgePoint
        )
      }
    ],
    { [startOrEnd === "start" ? "startBinding" : "endBinding"]: binding }
  );
};

const maybeCalculateNewGapWhenScaling = (
  changedLayer: ExcalidrawBindableLayer,
  currentBinding: PointBinding | null | undefined,
  newSize: { height: number; width: number } | undefined
): PointBinding | null | undefined => {
  if (currentBinding == null || newSize == null) {
    return currentBinding;
  }
  const { gap, focus, layerId } = currentBinding;
  const { width: newWidth, height: newHeight } = newSize;
  const { width, height } = changedLayer;
  const newGap = Math.max(
    1,
    Math.min(
      maxBindingGap(changedLayer, newWidth, newHeight),
      gap * (newWidth < newHeight ? newWidth / width : newHeight / height)
    )
  );
  return { layerId, gap: newGap, focus };
};

export const getEligibleLayersForBinding = (
  layers: NonDeleted<ExcalidrawLayer>[]
): SuggestedBinding[] => {
  const includedLayerIds = new Set(layers.map(({ id }) => id));
  return layers.flatMap((layer) =>
    isBindingLayer(layer, false)
      ? (getEligibleLayersForBindingLayer(
          layer as NonDeleted<ExcalidrawLinearLayer>
        ).filter(
          (layer) => !includedLayerIds.has(layer.id)
        ) as SuggestedBinding[])
      : isBindableLayer(layer, false)
      ? getEligibleLayersForBindableLayerAndWhere(layer).filter(
          (binding) => !includedLayerIds.has(binding[0].id)
        )
      : []
  );
};

const getEligibleLayersForBindingLayer = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>
): NonDeleted<ExcalidrawBindableLayer>[] =>
  [
    getEligibleLayerForBindingLayer(linearLayer, "start"),
    getEligibleLayerForBindingLayer(linearLayer, "end")
  ].filter(
    (layer): layer is NonDeleted<ExcalidrawBindableLayer> => layer != null
  );

const getEligibleLayerForBindingLayer = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  startOrEnd: "start" | "end"
): NonDeleted<ExcalidrawBindableLayer> | null =>
  getHoveredLayerForBinding(
    getLinearLayerEdgeCoors(linearLayer, startOrEnd),
    Scene.getScene(linearLayer)!
  );

const getLinearLayerEdgeCoors = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  startOrEnd: "start" | "end"
): { x: number; y: number } => {
  const index = startOrEnd === "start" ? 0 : -1;
  return tupleToCoors(
    LinearLayerEditor.getPointAtIndexGlobalCoordinates(linearLayer, index)
  );
};

const getEligibleLayersForBindableLayerAndWhere = (
  bindableLayer: NonDeleted<ExcalidrawBindableLayer>
): SuggestedPointBinding[] =>
  Scene.getScene(bindableLayer)!
    .getNonDeletedLayers()
    .map((layer) => {
      if (!isBindingLayer(layer, false)) {
        return null;
      }
      const canBindStart = isLinearLayerEligibleForNewBindingByBindable(
        layer,
        "start",
        bindableLayer
      );
      const canBindEnd = isLinearLayerEligibleForNewBindingByBindable(
        layer,
        "end",
        bindableLayer
      );
      if (!canBindStart && !canBindEnd) {
        return null;
      }
      return [
        layer,
        canBindStart && canBindEnd ? "both" : canBindStart ? "start" : "end",
        bindableLayer
      ];
    })
    .filter((maybeLayer) => maybeLayer != null) as SuggestedPointBinding[];

const isLinearLayerEligibleForNewBindingByBindable = (
  linearLayer: NonDeleted<ExcalidrawLinearLayer>,
  startOrEnd: "start" | "end",
  bindableLayer: NonDeleted<ExcalidrawBindableLayer>
): boolean => {
  const existingBinding =
    linearLayer[startOrEnd === "start" ? "startBinding" : "endBinding"];
  return (
    existingBinding == null &&
    !isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge(
      linearLayer,
      bindableLayer,
      startOrEnd
    ) &&
    bindingBorderTest(
      bindableLayer,
      getLinearLayerEdgeCoors(linearLayer, startOrEnd)
    )
  );
};

// We need to:
// 1: Update layers not selected to point to duplicated layers
// 2: Update duplicated layers to point to other duplicated layers
export const fixBindingsAfterDuplication = (
  sceneLayers: readonly ExcalidrawLayer[],
  oldLayers: readonly ExcalidrawLayer[],
  oldIdToDuplicatedId: Map<ExcalidrawLayer["id"], ExcalidrawLayer["id"]>,
  // There are three copying mechanisms: Copy-paste, duplication and alt-drag.
  // Only when alt-dragging the new "duplicates" act as the "old", while
  // the "old" layers act as the "new copy" - essentially working reverse
  // to the other two.
  duplicatesServeAsOld?: "duplicatesServeAsOld" | undefined
): void => {
  // First collect all the binding/bindable layers, so we only update
  // each once, regardless of whether they were duplicated or not.
  const allBoundLayerIds: Set<ExcalidrawLayer["id"]> = new Set();
  const allBindableLayerIds: Set<ExcalidrawLayer["id"]> = new Set();
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
    sceneLayers.filter(({ id }) =>
      allBoundLayerIds.has(id)
    ) as ExcalidrawLinearLayer[]
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

const newBindingAfterDuplication = (
  binding: PointBinding | null,
  oldIdToDuplicatedId: Map<ExcalidrawLayer["id"], ExcalidrawLayer["id"]>
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

export const fixBindingsAfterDeletion = (
  sceneLayers: readonly ExcalidrawLayer[],
  deletedLayers: readonly ExcalidrawLayer[]
): void => {
  const deletedLayerIds = new Set(deletedLayers.map((layer) => layer.id));
  // non-deleted which bindings need to be updated
  const affectedLayers: Set<ExcalidrawLayer["id"]> = new Set();
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

const newBindingAfterDeletion = (
  binding: PointBinding | null,
  deletedLayerIds: Set<ExcalidrawLayer["id"]>
): PointBinding | null => {
  if (binding == null || deletedLayerIds.has(binding.layerId)) {
    return null;
  }
  return binding;
};

const newBoundLayersAfterDeletion = (
  boundLayers: ExcalidrawLayer["boundLayers"],
  deletedLayerIds: Set<ExcalidrawLayer["id"]>
) => {
  if (!boundLayers) {
    return null;
  }
  return boundLayers.filter((ele) => !deletedLayerIds.has(ele.id));
};
