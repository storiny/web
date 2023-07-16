import { Mutable } from "@storiny/types";

import { Layer, Point } from "../../../types";
import { invalidateShapeForLayer } from "../../renderer";
import Scene from "../../scene/Scene";
import { getSizeFromPoints } from "../points";
import { getUpdatedTimestamp } from "../utils";

type LayerUpdate<TLayer extends Layer> = Omit<Partial<TLayer>, "id">;

/**
 * Mutates a layer
 * @param layer Layer to mutate
 * @param updates Mutations
 * @param informMutation Whether to inform mutation
 */
export const mutateLayer = <TLayer extends Mutable<Layer>>(
  layer: TLayer,
  updates: LayerUpdate<TLayer>,
  informMutation = true
): TLayer => {
  let didChange = false;

  // Casting to any because can't use `in` operator otherwise
  // (see https://github.com/microsoft/TypeScript/issues/21732)
  const { points, fileId } = updates as any;

  if (typeof points !== "undefined") {
    updates = { ...getSizeFromPoints(points), ...updates };
  }

  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (layer as any)[key] === value &&
        // If an object, always update because its attrs could have changed
        // (except for the specific keys we handle below)
        (typeof value !== "object" ||
          value === null ||
          key === "groupIds" ||
          key === "scale")
      ) {
        continue;
      }

      if (key === "scale") {
        const prevScale = (layer as any)[key];
        const nextScale = value;

        if (prevScale[0] === nextScale[0] && prevScale[1] === nextScale[1]) {
          continue;
        }
      } else if (key === "points") {
        const prevPoints = (layer as any)[key];
        const nextPoints = value;

        if (prevPoints.length === nextPoints.length) {
          let didChangePoints = false;
          let index = prevPoints.length;

          while (--index) {
            const prevPoint: Point = prevPoints[index];
            const nextPoint: Point = nextPoints[index];

            if (
              prevPoint[0] !== nextPoint[0] ||
              prevPoint[1] !== nextPoint[1]
            ) {
              didChangePoints = true;
              break;
            }
          }

          if (!didChangePoints) {
            continue;
          }
        }
      }

      (layer as any)[key] = value;
      didChange = true;
    }
  }

  if (!didChange) {
    return layer;
  }

  if (
    typeof updates.height !== "undefined" ||
    typeof updates.width !== "undefined" ||
    typeof fileId != "undefined" ||
    typeof points !== "undefined"
  ) {
    invalidateShapeForLayer(layer);
  }

  layer.updated = getUpdatedTimestamp();

  if (informMutation) {
    Scene.getScene(layer)?.informMutation();
  }

  return layer;
};

/**
 * Returns layer with updates
 * @param layer Layer
 * @param updates Layer updates
 */
export const newLayerWith = <TLayer extends Layer>(
  layer: TLayer,
  updates: LayerUpdate<TLayer>
): TLayer => {
  let didChange = false;

  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (layer as any)[key] === value &&
        // If an object, always update because its attrs could have changed
        (typeof value !== "object" || value === null)
      ) {
        continue;
      }

      didChange = true;
    }
  }

  if (!didChange) {
    return layer;
  }

  return {
    ...layer,
    ...updates,
    updated: getUpdatedTimestamp()
  };
};

/**
 * Updates layer timestamp
 * @param layer Layer
 */
export const bumpUpdate = (layer: Mutable<Layer>): Layer => {
  layer.updated = getUpdatedTimestamp();
  return layer;
};
