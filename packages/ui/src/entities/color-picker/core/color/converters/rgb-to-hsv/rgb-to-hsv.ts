import { HSV, RGB } from "../../../types";
import { normalize_rgb } from "../../utils";

/**
 * Converts RGB to HSV
 * @param rgb RGB color value
 */
export const rgb_to_hsv = (rgb: RGB): HSV => {
  const { r, g, b } = normalize_rgb(rgb);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const cmax = Math.max(red, green, blue);
  const cmin = Math.min(red, green, blue);
  const delta = cmax - cmin;
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
