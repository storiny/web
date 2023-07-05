import { normalizeRgb } from "~/entities/ColorPicker/core/color/utils";
import { clamp } from "~/utils/clamp";

import { RGBA } from "../../../types";
import { ALPHA_MAX } from "../../constants";

/**
 * Clamps RGBA color values
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param a Alpha
 */
export const normalizeRgba = ({ r, g, b, a }: RGBA): RGBA => ({
  ...normalizeRgb({ r, g, b }),
  a: clamp(0, a, ALPHA_MAX)
});
