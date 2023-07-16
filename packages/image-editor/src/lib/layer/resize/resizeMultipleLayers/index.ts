import { Mutable } from "@storiny/types";

import {
  ImageLayer,
  Layer,
  LinearLayer,
  NonDeletedLayer,
  Point,
  PointerDownState,
  TextLayer,
  TextLayerWithContainer
} from "../../../../types";
import Scene from "../../../scene/Scene";
import { updateBoundLayers } from "../../binding";
import { getCommonBoundingBox, getLayerPointsCoords } from "../../bounds";
import { LinearLayerEditor } from "../../LinearLayerEditor";
import { mutateLayer } from "../../mutate";
import {
  isBoundToContainer,
  isFreeDrawLayer,
  isImageLayer,
  isLinearLayer,
  isTextLayer
} from "../../predicates";
import { measureFontSizeFromWidth } from "../measureFontSizeFromWidth";
import { normalizeAngle } from "../normalizeAngle";

/**
 * Rescales points in layer
 * @param layer Layer
 * @param width Width
 * @param height Height
 * @param normalizePoints Whether to normalize points
 */
const rescalePointsInLayer = (
  layer: NonDeletedLayer,
  width: number,
  height: number,
  normalizePoints: boolean
) =>
  isLinearLayer(layer) || isFreeDrawLayer(layer)
    ? {
        points: rescalePoints(
          0,
          width,
          rescalePoints(1, height, layer.points, normalizePoints),
          normalizePoints
        )
      }
    : {};

/**
 * Resizes multiple layers
 * @param pointerDownState Pointer down state
 * @param selectedLayers Selected layers
 * @param transformHandleType Transform handle type
 * @param shouldResizeFromCenter Whether to resize from center
 * @param pointerX Pointer X position
 * @param pointerY Pointer Y position
 */
export const resizeMultipleLayers = (
  pointerDownState: PointerDownState,
  selectedLayers: readonly NonDeletedLayer[],
  transformHandleType: "nw" | "ne" | "sw" | "se",
  shouldResizeFromCenter: boolean,
  pointerX: number,
  pointerY: number
): void => {
  // Map selected layers to the original layers. While it should never
  // happen that pointerDownState.originalLayers won't contain the selected
  // layers during resize, this coupling isn't guaranteed, so to ensure
  // type safety we need to transform only those layers we filter
  const targetLayers = selectedLayers.reduce(
    (
      acc: {
        // Latest layer
        latest: NonDeletedLayer;
        // Layer at resize state
        orig: NonDeletedLayer;
      }[],
      layer
    ) => {
      const origLayer = pointerDownState.originalLayers.get(layer.id);

      if (origLayer) {
        acc.push({ orig: origLayer, latest: layer });
      }

      return acc;
    },
    []
  );

  // getCommonBoundingBox() uses getBoundTextLayer() which returns `null` for
  // original layers from `pointerDownState`, so we have to find and add these
  // bound text layers manually. Additionally, the coordinates of bound text
  // layers aren't always up to date
  const boundTextLayers = targetLayers.reduce((acc, { orig }) => {
    if (!isLinearLayer(orig)) {
      return acc;
    }

    const textId = getBoundTextLayerId(orig);

    if (!textId) {
      return acc;
    }

    const text = pointerDownState.originalLayers.get(textId) ?? null;

    if (!isBoundToContainer(text)) {
      return acc;
    }

    const xy = LinearLayerEditor.getBoundTextLayerPosition(orig, text);

    return [...acc, { ...text, ...xy }];
  }, [] as TextLayerWithContainer[]);

  const { minX, minY, maxX, maxY, midX, midY } = getCommonBoundingBox(
    targetLayers.map(({ orig }) => orig).concat(boundTextLayers)
  );
  const direction = transformHandleType;

  const mapDirectionsToAnchors: Record<typeof direction, Point> = {
    ne: [minX, maxY],
    se: [minX, minY],
    sw: [maxX, minY],
    nw: [maxX, maxY]
  };

  // Anchor point must be on the opposite side of the dragged selection handle
  // or be the center of the selection if `shouldResizeFromCenter`
  const [anchorX, anchorY]: Point = shouldResizeFromCenter
    ? [midX, midY]
    : mapDirectionsToAnchors[direction];

  const scale =
    Math.max(
      Math.abs(pointerX - anchorX) / (maxX - minX) || 0,
      Math.abs(pointerY - anchorY) / (maxY - minY) || 0
    ) * (shouldResizeFromCenter ? 2 : 1);

  if (scale === 0) {
    return;
  }

  const mapDirectionsToPointerPositions: Record<
    typeof direction,
    [x: boolean, y: boolean]
  > = {
    ne: [pointerX >= anchorX, pointerY <= anchorY],
    se: [pointerX >= anchorX, pointerY >= anchorY],
    sw: [pointerX <= anchorX, pointerY >= anchorY],
    nw: [pointerX <= anchorX, pointerY <= anchorY]
  };

  /**
   * To flip a layer:
   *
   * 1. Determine over which axis the layer is being flipped (could be x, y, or both), indicated
   * by `flipFactorX` and `flipFactorY`
   *
   * 2. Shift layer's position by the amount of width or height (or both) or mirror points
   * in the case of linear and free draw elements
   *
   * 3. Adjust the layer angle
   */
  const [flipFactorX, flipFactorY] = mapDirectionsToPointerPositions[
    direction
  ].map((condition) => (condition ? 1 : -1));
  const isFlippedByX = flipFactorX < 0;
  const isFlippedByY = flipFactorY < 0;

  const layersAndUpdates: {
    boundText: {
      baseline: TextLayer["baseline"];
      fontSize: TextLayer["fontSize"];
      layer: TextLayerWithContainer;
    } | null;
    layer: NonDeletedLayer;
    update: Mutable<Pick<Layer, "x" | "y" | "width" | "height" | "angle">> & {
      baseline?: TextLayer["baseline"];
      fontSize?: TextLayer["fontSize"];
      points?: LinearLayer["points"];
      scale?: ImageLayer["scale"];
    };
  }[] = [];

  for (const { orig, latest } of targetLayers) {
    // Bounded text layers are updated along with their container layers
    if (isTextLayer(orig) && isBoundToContainer(orig)) {
      continue;
    }

    const width = orig.width * scale;
    const height = orig.height * scale;
    const angle = normalizeAngle(orig.angle * flipFactorX * flipFactorY);
    const isLinearOrFreeDraw = isLinearLayer(orig) || isFreeDrawLayer(orig);
    const offsetX = orig.x - anchorX;
    const offsetY = orig.y - anchorY;
    const shiftX = isFlippedByX && !isLinearOrFreeDraw ? width : 0;
    const shiftY = isFlippedByY && !isLinearOrFreeDraw ? height : 0;
    const x = anchorX + flipFactorX * (offsetX * scale + shiftX);
    const y = anchorY + flipFactorY * (offsetY * scale + shiftY);
    const rescaledPoints = rescalePointsInLayer(
      orig,
      width * flipFactorX,
      height * flipFactorY,
      false
    );

    const update: (typeof layersAndUpdates)[0]["update"] = {
      x,
      y,
      width,
      height,
      angle,
      ...rescaledPoints
    };

    if (isImageLayer(orig) && targetLayers.length === 1) {
      update.scale = [orig.scale[0] * flipFactorX, orig.scale[1] * flipFactorY];
    }

    if (isLinearLayer(orig) && (isFlippedByX || isFlippedByY)) {
      const origBounds = getLayerPointsCoords(orig, orig.points);
      const newBounds = getLayerPointsCoords(
        { ...orig, x, y },
        rescaledPoints.points!
      );
      const origXY = [orig.x, orig.y];
      const newXY = [x, y];

      const linearShift = (axis: "x" | "y"): number => {
        const i = axis === "x" ? 0 : 1;
        return (
          (newBounds[i + 2] -
            newXY[i] -
            (origXY[i] - origBounds[i]) * scale +
            (origBounds[i + 2] - origXY[i]) * scale -
            (newXY[i] - newBounds[i])) /
          2
        );
      };

      if (isFlippedByX) {
        update.x -= linearShift("x");
      }

      if (isFlippedByY) {
        update.y -= linearShift("y");
      }
    }

    let boundText: (typeof layersAndUpdates)[0]["boundText"] = null;
    const boundTextLayer = getBoundTextLayer(latest);

    if (boundTextLayer || isTextLayer(orig)) {
      const updatedLayer = {
        ...latest,
        width,
        height
      };
      const metrics = measureFontSizeFromWidth(
        boundTextLayer ?? (orig as TextLayer),
        boundTextLayer
          ? getBoundTextMaxWidth(updatedLayer)
          : updatedLayer.width,
        boundTextLayer
          ? getBoundTextMaxHeight(updatedLayer, boundTextLayer)
          : updatedLayer.height
      );

      if (!metrics) {
        return;
      }

      if (isTextLayer(orig)) {
        update.fontSize = metrics.size;
        update.baseline = metrics.baseline;
      }

      if (boundTextLayer) {
        boundText = {
          layer: boundTextLayer,
          fontSize: metrics.size,
          baseline: metrics.baseline
        };
      }
    }

    layersAndUpdates.push({ layer: latest, update, boundText });
  }

  const layersToUpdate = layersAndUpdates.map(({ layer }) => layer);

  for (const { layer, update, boundText } of layersAndUpdates) {
    const { width, height, angle } = update;

    mutateLayer(layer, update, false);
    updateBoundLayers(layer, {
      simultaneouslyUpdated: layersToUpdate,
      newSize: { width, height }
    });

    if (boundText) {
      const { layer: boundTextLayer, ...boundTextUpdates } = boundText;

      mutateLayer(
        boundTextLayer,
        {
          ...boundTextUpdates,
          angle: isLinearLayer(layer) ? undefined : angle
        },
        false
      );

      handleBindTextResize(layer, transformHandleType);
    }
  }

  Scene.getScene(layersAndUpdates[0].layer)?.informMutation();
};
