import { FabricObject } from "fabric";
import { Options } from "roughjs/bin/core";

import { LayerType, StrokeStyle } from "../../constants";
import { get_dashed_dash_array } from "../get-dashed-dash-array";
import { get_dotted_dash_array } from "../get-dotted-dash-array";

/**
 * Generates options for roughjs
 * @param object Object
 * @param continuous_path Whether the object is a continuous path
 */
export const generate_rough_options = (
  object: FabricObject,
  continuous_path = false
): Options => {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
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
        ? get_dashed_dash_array(object.strokeWidth)
        : object.get("strokeStyle") === StrokeStyle.DOTTED
          ? get_dotted_dash_array(object.strokeWidth)
          : undefined,
    preserveVertices: continuous_path
  };
  /* eslint-enable prefer-snakecase/prefer-snakecase */

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
    case LayerType.ARROW:
      return options;
    default: {
      throw new Error(`Unimplemented type ${object.get("_type")}`);
    }
  }
};
