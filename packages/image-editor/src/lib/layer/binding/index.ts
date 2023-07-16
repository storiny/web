import React from "react";

import { KEYS, LayerType } from "../../../constants";
import {
  BindableLayer,
  EditorState,
  Layer,
  LinearLayer,
  NonDeleted,
  NonDeletedLayer,
  PointBinding
} from "../../../types";
import Scene from "../../scene/Scene";
import {
  bindingBorderTest,
  determineFocusDistance,
  determineFocusPoint,
  distanceToBindableLayer,
  intersectLayerWithLine,
  maxBindingGap
} from "../collision";
import { LinearLayerEditor } from "../LinearLayerEditor";
import { isBindableLayer, isBindingLayer, isLinearLayer } from "../predicates";
import { getBoundTextLayer } from "../textElement";
import { handleBindTextResize } from "../textLayer";
import { arrayToMap, tupleToCoors } from "../utils";

export type SuggestedBinding =
  | NonDeleted<BindableLayer>
  | SuggestedPointBinding;

export type SuggestedPointBinding = [
  NonDeleted<LinearLayer>,
  "start" | "end" | "both",
  NonDeleted<BindableLayer>
];

/**
 * Predicate function for enabling binding for pointer event
 * @param event Pointer event
 */
export const shouldEnableBindingForPointerEvent = (
  event: React.PointerEvent<HTMLLayer>
): boolean => !event[KEYS.CTRL_OR_CMD];

/**
 * Predicate function for checking whether bindings are enabled
 * @param editorState Editor state
 */
export const isBindingEnabled = (editorState: EditorState): boolean =>
  editorState.isBindingEnabled;

/**
 * Returns non-deleted layers from scene
 * @param scene Scene
 * @param ids Layer IDS
 */
const getNonDeletedLayers = (
  scene: Scene,
  ids: readonly Layer["id"][]
): NonDeleted<Layer>[] => {
  const result: NonDeleted<Layer>[] = [];

  ids.forEach((id) => {
    const layer = scene.getNonDeletedLayer(id);
    if (layer != null) {
      result.push(layer);
    }
  });

  return result;
};

/**
 * Binds or unbinds a linear layer
 * @param linearLayer Linear layer
 * @param startBindingLayer Start binding layer
 * @param endBindingLayer End binding layer
 */
export const bindOrUnbindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  startBindingLayer: BindableLayer | null | "keep",
  endBindingLayer: BindableLayer | null | "keep"
): void => {
  const boundToLayerIds: Set<BindableLayer["id"]> = new Set();
  const unboundFromLayerIds: Set<BindableLayer["id"]> = new Set();

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
          (layer) =>
            layer.type !== LayerType.ARROW || layer.id !== linearLayer.id
        )
      });
    }
  );
};

/**
 * Binds or unbinds linear layer edge
 * @param linearLayer Linear layer
 * @param bindableLayer Bindable layer
 * @param otherEdgeBindableLayer Other edge of the bindable layer
 * @param startOrEnd Start or end enum
 * @param boundToLayerIds Mutated binded layer IDS
 * @param unboundFromLayerIds Mutated unbinded layer IDS
 */
const bindOrUnbindLinearLayerEdge = (
  linearLayer: NonDeleted<LinearLayer>,
  bindableLayer: BindableLayer | null | "keep",
  otherEdgeBindableLayer: BindableLayer | null | "keep",
  startOrEnd: "start" | "end",
  boundToLayerIds: Set<BindableLayer["id"]>,
  unboundFromLayerIds: Set<BindableLayer["id"]>
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

/**
 * Binds or unbinds selected layers
 * @param layers Layers
 */
export const bindOrUnbindSelectedLayers = (
  layers: NonDeleted<Layer>[]
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

/**
 * Tries to bind a bindable layer
 * @param bindableLayer Bindable layer
 */
const maybeBindBindableLayer = (
  bindableLayer: NonDeleted<BindableLayer>
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

/**
 * Tries to bind linear layer
 * @param linearLayer Linear layer
 * @param editorState Editor state
 * @param scene Scene
 * @param pointerCoords Pointer coordinates
 */
export const maybeBindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  editorState: EditorState,
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

/**
 * Binds a linear layer
 * @param linearLayer Linear layer
 * @param hoveredLayer Hovered layer
 * @param startOrEnd Start or end enum
 */
const bindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  hoveredLayer: BindableLayer,
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
        type: LayerType.ARROW
      })
    });
  }
};

/**
 * Prevents binding both ends of a simple segment
 * @param linearLayer Linear layer
 * @param bindableLayer Bindable layer
 * @param startOrEnd Start or end enum
 */
const isLinearLayerSimpleAndAlreadyBoundOnOppositeEdge = (
  linearLayer: NonDeleted<LinearLayer>,
  bindableLayer: BindableLayer,
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

/**
 * Predicate function for checking whether a simple linear layer is already bound
 * @param linearLayer Linear layer
 * @param alreadyBoundToId Bindable layer ID
 * @param bindableLayer Bindable layer
 */
export const isLinearLayerSimpleAndAlreadyBound = (
  linearLayer: NonDeleted<LinearLayer>,
  alreadyBoundToId: BindableLayer["id"] | undefined,
  bindableLayer: BindableLayer
): boolean =>
  alreadyBoundToId === bindableLayer.id && linearLayer.points.length < 3;

/**
 * Unbinds linear layers
 * @param layers Layers to unbind
 */
export const unbindLinearLayers = (layers: NonDeleted<Layer>[]): void => {
  layers.forEach((layer) => {
    if (isBindingLayer(layer)) {
      bindOrUnbindLinearLayer(layer, null, null);
    }
  });
};

/**
 * Unbinds a linear layer
 * @param linearLayer Linear layer to unbind
 * @param startOrEnd Start or end enum
 */
const unbindLinearLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end"
): BindableLayer["id"] | null => {
  const field = startOrEnd === "start" ? "startBinding" : "endBinding";
  const binding = linearLayer[field];

  if (binding == null) {
    return null;
  }

  mutateLayer(linearLayer, { [field]: null });
  return binding.layerId;
};

/**
 * Returns the hovered layer for binding
 * @param pointerCoords Pointer coordinates
 * @param scene Scene
 */
export const getHoveredLayerForBinding = (
  pointerCoords: {
    x: number;
    y: number;
  },
  scene: Scene
): NonDeleted<BindableLayer> | null =>
  getLayerAtPosition(
    scene.getNonDeletedLayers(),
    (layer) =>
      isBindableLayer(layer, false) && bindingBorderTest(layer, pointerCoords)
  ) as NonDeleted<BindableLayer> | null;

/**
 * Returns the focus and gap values for layer
 * @param linearLayer Linear layer
 * @param hoveredLayer Hovered layer
 * @param startOrEnd Start or end enum
 */
const calculateFocusAndGap = (
  linearLayer: NonDeleted<LinearLayer>,
  hoveredLayer: BindableLayer,
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

/**
 * Updates bound layers. Supports translating, rotating, and scaling `changedLayer` with
 * bound linear layers, as scaling involves moving the focus points as well, it is
 * done before the `changedLayer` is updated, and the `newSize` is passed in explicitly.
 * @param changedLayer Chaged layer
 * @param options Update options
 */
export const updateBoundLayers = (
  changedLayer: NonDeletedLayer,
  options?: {
    newSize?: { height: number; width: number };
    simultaneouslyUpdated?: readonly Layer[];
  }
): void => {
  const boundLinearLayers = (changedLayer.boundLayers ?? []).filter(
    (layer) => layer.type === LayerType.ARROW
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
    boundLinearLayers.map(({ id }) => id)
  ).forEach((layer) => {
    if (!isLinearLayer(layer)) {
      return;
    }

    const bindableLayer = changedLayer as BindableLayer;
    // In case the `boundLayers` are stale
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
      changedLayer as BindableLayer
    );
    updateBoundPoint(layer, "end", endBinding, changedLayer as BindableLayer);

    const boundText = getBoundTextLayer(layer);
    if (boundText) {
      handleBindTextResize(layer, false);
    }
  });
};

/**
 * Predicate function for determining stale layers
 * @param boundLayer Bound linear layer
 * @param changedLayer Changed layer
 */
const doesNeedUpdate = (
  boundLayer: NonDeleted<LinearLayer>,
  changedLayer: BindableLayer
): boolean =>
  boundLayer.startBinding?.layerId === changedLayer.id ||
  boundLayer.endBinding?.layerId === changedLayer.id;

/**
 * Returns the set of simultaneously updated layer IDS
 * @param simultaneouslyUpdated Simultaneously updated layers
 */
const getSimultaneouslyUpdatedLayerIds = (
  simultaneouslyUpdated: readonly Layer[] | undefined
): Set<Layer["id"]> =>
  new Set((simultaneouslyUpdated || []).map(({ id }) => id));

/**
 * Updates bound point
 * @param linearLayer Linear layer
 * @param startOrEnd Start or end enum
 * @param binding Point binding
 * @param changedLayer Changed layer
 */
const updateBoundPoint = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end",
  binding: PointBinding | null | undefined,
  changedLayer: BindableLayer
): void => {
  if (
    binding == null ||
    // We only need to update the other end if this is a 2-point line layer
    (binding.layerId !== changedLayer.id && linearLayer.points.length > 2)
  ) {
    return;
  }

  const bindingLayer = Scene.getScene(linearLayer)!.getLayer(
    binding.layerId
  ) as BindableLayer | null;

  if (bindingLayer == null) {
    // We're not cleaning up after deleted layers at the moment, so handle this case
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
      // This should never happen, since `focusPoint` should always be
      // inside the layer, but just in case, bail out
      newEdgePoint = focusPointAbsolute;
    } else {
      // Guaranteed to intersect because `focusPoint` is always inside the shape
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

/**
 * Tries to compute gap values when scaling
 * @param changedLayer Changed bindable layer
 * @param currentBinding Current point binding
 * @param newSize New size
 */
const maybeCalculateNewGapWhenScaling = (
  changedLayer: BindableLayer,
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

/**
 * Returns the layers eligible for binding
 * @param layers Layers to check for eligibility
 */
export const getEligibleLayersForBinding = (
  layers: NonDeleted<Layer>[]
): SuggestedBinding[] => {
  const includedLayerIds = new Set(layers.map(({ id }) => id));
  return layers.flatMap((layer) =>
    isBindingLayer(layer, false)
      ? (getEligibleLayersForBindingLayer(
          layer as NonDeleted<LinearLayer>
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

/**
 * Returns the layers eligible for binding layer
 * @param linearLayer Linear layer
 */
const getEligibleLayersForBindingLayer = (
  linearLayer: NonDeleted<LinearLayer>
): NonDeleted<BindableLayer>[] =>
  [
    getEligibleLayerForBindingLayer(linearLayer, "start"),
    getEligibleLayerForBindingLayer(linearLayer, "end")
  ].filter((layer): layer is NonDeleted<BindableLayer> => layer != null);

/**
 * Returns the layer elligible for binding layer
 * @param linearLayer Linear layer
 * @param startOrEnd Start or end enum
 */
const getEligibleLayerForBindingLayer = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end"
): NonDeleted<BindableLayer> | null =>
  getHoveredLayerForBinding(
    getLinearLayerEdgeCoors(linearLayer, startOrEnd),
    Scene.getScene(linearLayer)!
  );

/**
 * Returns the edge coordinates of a linear layer
 * @param linearLayer Linear layer
 * @param startOrEnd Start or end enum
 */
const getLinearLayerEdgeCoors = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end"
): { x: number; y: number } =>
  tupleToCoors(
    LinearLayerEditor.getPointAtIndexGlobalCoordinates(
      linearLayer,
      startOrEnd === "start" ? 0 : -1
    )
  );

/**
 * Returns the elligible layers for bindable layer with suggested bindings
 * @param bindableLayer Bindable layer
 */
const getEligibleLayersForBindableLayerAndWhere = (
  bindableLayer: NonDeleted<BindableLayer>
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

/**
 * Predicate function for checking whether a linear layer is avaliable for binding
 * @param linearLayer Linear layer to check
 * @param startOrEnd Start or end enum
 * @param bindableLayer Bindable layer
 */
const isLinearLayerEligibleForNewBindingByBindable = (
  linearLayer: NonDeleted<LinearLayer>,
  startOrEnd: "start" | "end",
  bindableLayer: NonDeleted<BindableLayer>
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
