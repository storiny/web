import {
  rgbToHex,
  rgbToHsv
} from "~/entities/ColorPicker/core/color/converters";

import { RGBA, TColor } from "../../types";

/**
 * Converts RGBA to color object
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param a Alpha
 */
export const rgbaToColorObject = ({ r, g, b, a }: RGBA): TColor => {
  const hex = rgbToHex({ r, g, b });
  const { h, s, v } = rgbToHsv({ r, g, b });

  return {
    h,
    s,
    v,
    hex,
    str: hex,
    r,
    g,
    b,
    a
  };
};
