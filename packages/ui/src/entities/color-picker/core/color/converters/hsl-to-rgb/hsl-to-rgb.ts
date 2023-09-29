import { HSL, RGB } from "../../../types";

/**
 * Converts HSL to RGB
 * @param h Hue
 * @param s Saturation
 * @param l Lightness
 */
export const hsl_to_rgb = ({ h, s, l }: HSL): RGB => {
  const sat = s / 100;
  const light = l / 100;
  let C = sat * (1 - Math.abs(2 * light - 1));
  const H = h / 60;
  let X = C * (1 - Math.abs((H % 2) - 1));
  let m = light - C / 2;
  const precision = 255;

  C = ((C + m) * precision) | 0;
  X = ((X + m) * precision) | 0;
  m = (m * precision) | 0;

  if (H >= 0 && H < 1) {
    return { r: C, g: X, b: m };
  }

  if (H >= 1 && H < 2) {
    return { r: X, g: C, b: m };
  }

  if (H >= 2 && H < 3) {
    return { r: m, g: C, b: X };
  }

  if (H >= 3 && H < 4) {
    return { r: m, g: X, b: C };
  }

  if (H >= 4 && H < 5) {
    return { r: X, g: m, b: C };
  }

  if (H >= 5 && H < 6) {
    return { r: C, g: m, b: X };
  }

  return { r: 0, g: 0, b: 0 };
};
