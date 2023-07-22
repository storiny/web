import { RGBA, TColor } from "../../types";
import { rgbaToStr, rgbToHex, rgbToHsv } from "../converters";
import { cssColor } from "../cssColor";

/**
 * Computes color values from RGBA values
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param a Alpha
 */
const getColorFromRGBA = ({
  r,
  g,
  b,
  a
}: RGBA): {
  a: number;
  b: number;
  g: number;
  h: number;
  hex: string;
  r: number;
  s: number;
  str: string;
  v: number;
} => {
  const { h, s, v } = rgbToHsv({ r, g, b });
  const hex = rgbToHex({ r, g, b }, false);
  const str = rgbaToStr({ r, g, b, a });
  return { r, g, b, a, h, s, v, hex, str };
};

/**
 * Converts a CSS color string to a color object.
 * Hex colors must be prefixed with #.
 * @see https://github.com/microsoft/fluentui
 * @param inputColor Input color string
 */
export const strToColor = (inputColor?: string): TColor | undefined => {
  const color = cssColor(inputColor);

  if (!color) {
    return;
  }

  return {
    ...getColorFromRGBA(color!),
    str: inputColor || ""
  };
};
