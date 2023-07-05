import { HEX, HSV } from "../../../types";
import { hsvToRgb } from "../hsvToRgb";
import { rgbToHex } from "../rgbToHex";

/**
 * Converts HSV to HEX
 * @param h Hue
 * @param s Saturation
 * @param v Value
 */
export const hsvToHex = ({ h, s, v }: HSV): HEX => {
  let { r, g, b } = hsvToRgb({ h, s, v });
  return rgbToHex({ r, g, b });
};
