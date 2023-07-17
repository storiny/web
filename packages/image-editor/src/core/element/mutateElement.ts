import Scene from "../../lib/scene/scene/Scene";
import { getSizeFromPoints } from "../points";
import { randomInteger } from "../random";
import { invalidateShapeForLayer } from "../renderer/renderLayer";
import { Point } from "../types";
import { Mutable } from "../utility-types";
import { getUpdatedTimestamp } from "../utils";
import { ExcalidrawLayer } from "./types";

type LayerUpdate<TLayer extends ExcalidrawLayer> = Omit<
  Partial<TLayer>,
  "id" | "version" | "versionNonce"
>;

// This function tracks updates of text layers for the purposes for collaboration.
// The version is used to compare updates when more than one user is working in
// the same drawing. Note: this will trigger the component to update. Make sure you
// are calling it either from a React event handler or within unstable_batchedUpdates().
export const mutateLayer = <TLayer extends Mutable<ExcalidrawLayer>>(
  layer: TLayer,
  updates: LayerUpdate<TLayer>,
  informMutation = true
): TLayer => {
  let didChange = false;

  // casting to any because can't use `in` operator
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
        // if object, always update because its attrs could have changed
        // (except for specific keys we handle below)
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

  layer.version++;
  layer.versionNonce = randomInteger();
  layer.updated = getUpdatedTimestamp();

  if (informMutation) {
    Scene.getScene(layer)?.informMutation();
  }

  return layer;
};

export const newLayerWith = <TLayer extends ExcalidrawLayer>(
  layer: TLayer,
  updates: LayerUpdate<TLayer>
): TLayer => {
  let didChange = false;
  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (layer as any)[key] === value &&
        // if object, always update because its attrs could have changed
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
    updated: getUpdatedTimestamp(),
    version: layer.version + 1,
    versionNonce: randomInteger()
  };
};

/**
 * Mutates layer, bumping `version`, `versionNonce`, and `updated`.
 *
 * NOTE: does not trigger re-render.
 */
export const bumpUpdate = (
  layer: Mutable<ExcalidrawLayer>,
  version?: ExcalidrawLayer["version"]
) => {
  layer.version = (version ?? layer.version) + 1;
  layer.versionNonce = randomInteger();
  layer.updated = getUpdatedTimestamp();
  return layer;
};
