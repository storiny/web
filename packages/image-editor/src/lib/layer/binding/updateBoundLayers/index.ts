import { LayerType } from "../../../../constants";
import {
  BindableLayer,
  Layer,
  LinearLayer,
  NonDeleted,
  NonDeletedLayer,
  PointBinding
} from "../../../../types";
import Scene from "../../../scene/scene/Scene";
import {
  determineFocusPoint,
  intersectLayerWithLine,
  maxBindingGap
} from "../../collision";
import { LinearLayerEditor } from "../../linearLayerEditor";
import { mutateLayer } from "../../mutate";
import { isLinearLayer } from "../../predicates";
import { getBoundTextLayer, handleBindTextResize } from "../../text";
import { getNonDeletedLayers } from "../getNonDeletedLayersFromScene";

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
