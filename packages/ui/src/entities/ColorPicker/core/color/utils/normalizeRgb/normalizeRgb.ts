import { clamp } from "~/utils/clamp";

import { RGB } from "../../../types";
import { RGB_MAX } from "../../constants";

/**
 * Clamps RGB color values
 * @param r Red
 * @param g Green
 * @param b Blue
 */
export const normalizeRgb = ({ r, g, b }: RGB): RGB => ({
  r: clamp(0, r, RGB_MAX),
  g: clamp(0, g, RGB_MAX),
  b: clamp(0, b, RGB_MAX)
});
