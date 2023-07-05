import { HEX, HSV } from "../../../types";
import { hexToRgb } from "../hexToRgb";
import { rgbToHsv } from "../rgbToHsv";

/**
 * Converts HEX to HSV
 * @param hex Input hex color string
 */
export const hexToHsv = (hex: HEX): HSV => {
  const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  return rgbToHsv(rgb);
};
