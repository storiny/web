import { HSL, RGB } from "../../../types";

/**
 * Converts RGB to HSL
 * @param r Red
 * @param g Green
 * @param b Blue
 */
export const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  let red = r / 255;
  let green = g / 255;
  let blue = b / 255;

  let cmax = Math.max(red, green, blue);
  let cmin = Math.min(red, green, blue);
  let delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = (cmax + cmin) / 2;
  let X = 1 - Math.abs(2 * l - 1);

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
      s = delta / X;
    }
  }

  h = (60 * h) | 0;

  if (h < 0) {
    h += 360;
  }

  s = (s * 100) | 0;
  l = (l * 100) | 0;

  return { h, s, l };
};
