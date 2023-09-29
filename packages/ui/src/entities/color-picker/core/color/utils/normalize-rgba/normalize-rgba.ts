import { clamp } from "~/utils/clamp";

import { RGBA } from "../../../types";
import { ALPHA_MAX } from "../../constants";
import { normalize_rgb } from "../../utils";

/**
 * Clamps RGBA color values
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param a Alpha
 */
export const normalize_rgba = ({ r, g, b, a }: RGBA): RGBA => ({
  ...normalize_rgb({ r, g, b }),
  a: clamp(0, a, ALPHA_MAX)
});
