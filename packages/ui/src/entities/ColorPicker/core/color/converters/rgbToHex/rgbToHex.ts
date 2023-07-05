import { HEX, RGB } from "../../../types";

/**
 * Converts RGB to HEX
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param withHash If `true`, returns hex color with a #
 */
export const rgbToHex = ({ r, g, b }: RGB, withHash: boolean = true): HEX =>
  (withHash ? "#" : "") +
  ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
