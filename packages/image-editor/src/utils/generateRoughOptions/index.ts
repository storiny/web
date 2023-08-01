import { BaseFabricObject } from "fabric";
import { Options } from "roughjs/bin/core";

import { LayerType, StrokeStyle } from "../../constants";
import { getDashedDashArray } from "../getDashedDashArray";
import { getDottedDashArray } from "../getDottedDashArray";

/**
 * Generates options for roughjs
 * @param object Object
 * @param continuousPath Whether the object is a continuous path
 */
export const generateRoughOptions = (
  object: BaseFabricObject,
  continuousPath = false
): Options => {
  const options: Options = {
    seed: object.get("seed"),
    stroke: object.stroke as string,
    // For non-solid strokes, disable `multiStroke` because it tends to make
    // dashes / dots overlay over each other
    disableMultiStroke: object.get("strokeStyle") !== StrokeStyle.SOLID,
    // For non-solid strokes, increase the width a bit to make it visually
    // similar to solid strokes, as we're also disabling `multiStroke`
    strokeWidth:
      object.get("strokeStyle") !== StrokeStyle.SOLID
        ? object.strokeWidth + 0.5
        : object.strokeWidth,
    fill: object.fill as string,
    fillWeight: object.get("fillWeight"),
    hachureGap: object.get("hachureGap"),
    roughness: object.get("roughness"),
    strokeLineDash:
      object.get("strokeStyle") === StrokeStyle.DASHED
        ? getDashedDashArray(object.strokeWidth)
        : object.get("strokeStyle") === StrokeStyle.DOTTED
        ? getDottedDashArray(object.strokeWidth)
        : undefined,
    preserveVertices: continuousPath
  };

  switch (object.get("_type")) {
    case LayerType.DIAMOND:
    case LayerType.RECTANGLE:
    case LayerType.ELLIPSE: {
      options.fillStyle = object.get("fillStyle");

      if (object.get("_type") === LayerType.ELLIPSE) {
        options.curveFitting = 1;
      }

      return options;
    }
    case LayerType.LINE:
    case LayerType.PEN: {
      // if (isPathALoop(element.points)) {
      //   options.fillStyle = object.get("fillStyle");
      // }

      return options;
    }
    case LayerType.ARROW:
      return options;
    default: {
      throw new Error(`Unimplemented type ${object.get("_type")}`);
    }
  }
};
