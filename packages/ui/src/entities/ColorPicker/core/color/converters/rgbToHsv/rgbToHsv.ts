import { HSV, RGB } from "../../../types";
import { normalizeRgb } from "../../utils";

/**
 * Converts RGB to HSV
 * @param rgb RGB color value
 */
export const rgbToHsv = (rgb: RGB): HSV => {
  const { r, g, b } = normalizeRgb(rgb);
  let red = r / 255;
  let green = g / 255;
  let blue = b / 255;

  let cmax = Math.max(red, green, blue);
  let cmin = Math.min(red, green, blue);
  let delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let v = 0;

  if (delta) {
    if (cmax === red) {
      h = (green - blue) / delta;
    }

    if (cmax === green) {
      h = 2 + (blue - red) / delta;
    }

    if (cmax === blue) {
      h = 4 + (red - green) / delta;
    }

    if (cmax) {
      s = delta / cmax;
    }
  }

  h = (60 * h) | 0;

  if (h < 0) {
    h += 360;
  }

  s = (s * 100) | 0;
  v = (cmax * 100) | 0;

  return { h, s, v };
};
