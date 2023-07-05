import { RGB } from "../../../types";
import { isValidHex } from "../../utils";

/**
 * Converts HEX to RGB
 * @param hex Hex color string
 * @param fallback Fallback color value
 */
export const hexToRgb = (hex: string, fallback: any = null): RGB => {
  if (!isValidHex(hex)) {
    return fallback;
  }

  if (hex[0] === "#") {
    hex = hex.slice(1, hex.length);
  }

  if (hex.length === 3) {
    hex = hex.replace(/([0-9A-F])([0-9A-F])([0-9A-F])/i, "$1$1$2$2$3$3");
  }

  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  return {
    r,
    g,
    b
  };
};
