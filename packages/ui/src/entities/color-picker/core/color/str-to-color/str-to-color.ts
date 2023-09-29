import { RGBA, TColor } from "../../types";
import { rgba_to_str, rgb_to_hex, rgb_to_hsv } from "../converters";
import { css_color } from "../css-color";

/**
 * Computes color values from RGBA values
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param a Alpha
 */
const get_color_from_rgba = ({
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
  const { h, s, v } = rgb_to_hsv({ r, g, b });
  const hex = rgb_to_hex({ r, g, b }, false);
  const str = rgba_to_str({ r, g, b, a });
  return { r, g, b, a, h, s, v, hex, str };
};

/**
 * Converts a CSS color string to a color object.
 * Hex colors must be prefixed with #.
 * @see https://github.com/microsoft/fluentui
 * @param input_color Input color string
 */
export const str_to_color = (input_color?: string): TColor | undefined => {
  const color = css_color(input_color);

  if (!color) {
    return;
  }

  return {
    ...get_color_from_rgba(color!),
    str: input_color || ""
  };
};
