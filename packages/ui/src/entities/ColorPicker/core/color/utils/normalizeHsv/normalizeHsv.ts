import { clamp } from "~/utils/clamp";

import { HSV } from "../../../types";
import { HUE_MAX, SV_MAX } from "../../constants";

/**
 * Clamps HSV color values
 * @param h Hue
 * @param s Saturation
 * @param v Value
 */
export const normalizeHsv = ({ h, s, v }: HSV): HSV => ({
  h: clamp(0, h, HUE_MAX),
  s: clamp(0, s, SV_MAX),
  v: clamp(0, v, SV_MAX)
});
