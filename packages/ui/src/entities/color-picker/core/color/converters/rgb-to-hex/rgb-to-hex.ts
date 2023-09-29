import { HEX, RGB } from "../../../types";

/**
 * Converts RGB to HEX
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param with_hash If `true`, returns hex color with the `#` prefix
 */
export const rgb_to_hex = ({ r, g, b }: RGB, with_hash = true): HEX =>
  (with_hash ? "#" : "") +
  ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
