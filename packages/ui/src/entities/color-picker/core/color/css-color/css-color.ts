import { RGBA } from "../../types";
import { ALPHA_MAX } from "../constants";
import { hsl_to_rgb } from "../converters";
import { normalize_rgba } from "../utils";

/**
 * Converts a valid CSS color string to an RGB color.
 * Hex colors must be prefixed with #.
 * @see https://github.com/microsoft/fluentui
 * @param color Input CSS color string
 */
export const css_color = (color?: string): RGBA | undefined => {
  if (!color) {
    return undefined;
  }

  // Need to check the following valid color formats: RGB(A), HSL(A), hex, named color

  // First check for well formatted RGB(A), HSL(A), and hex formats at the start.
  // This is for perf (not creating an element) and catches the intentional "transparent" color case early on.
  const easy_color: RGBA | undefined =
    easy_rgba(color) ||
    easy_hex6(color) ||
    easy_hex3(color) ||
    easy_hsla(color);

  if (easy_color) {
    return normalize_rgba(easy_color);
  }

  // If the above fails, do the more expensive catch-all
  return browser_compute(color);
};

/**
 * Uses the browser's getComputedStyle() to determine what the passed-in color is.
 * This assumes easy_rgba, easy_hex6, easy_hex3, and easy_hsla have already been tried and all failed.
 * @param str CSS color string
 */
const browser_compute = (str: string): RGBA | undefined => {
  if (typeof document === "undefined") {
    // Don't throw an error when used server-side
    return undefined;
  }

  const elem = document.createElement("div");
  elem.style.backgroundColor = str;
  // This element must be attached to the DOM for getComputedStyle() to have a value
  elem.style.position = "absolute";
  elem.style.top = "-9999px";
  elem.style.left = "-9999px";
  elem.style.height = "1px";
  elem.style.width = "1px";

  document.body.appendChild(elem);

  const computed_style = getComputedStyle(elem);
  const computed_color = computed_style && computed_style.backgroundColor;

  document.body.removeChild(elem);
  // `computed_color` is always an RGB(A) string, except for invalid colors in IE/Edge which return 'transparent'

  // Browsers return one of these if the color string is invalid, so need to differentiate between an actual error and intentionally passing in this color
  if (
    computed_color === "rgba(0, 0, 0, 0)" ||
    computed_color === "transparent"
  ) {
    switch (str.trim()) {
      // RGB and HSL were already checked at the start of the function
      case "transparent":
      case "#0000":
      case "#00000000":
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    return undefined;
  }

  const easy_value = easy_rgba(computed_color);
  return easy_value ? normalize_rgba(easy_value) : undefined;
};

/**
 * If `str` is in valid `rgb()` or `rgba()` format, returns an RGB color (alpha defaults to 100).
 * @param str Input color string
 */
const easy_rgba = (str?: string | null): RGBA | undefined => {
  if (!str) {
    return undefined;
  }

  const match = str.match(/^rgb(a?)\(([\d., ]+)\)$/);
  if (match) {
    const has_alpha = !!match[1];
    const expected_part_count = has_alpha ? 4 : 3;
    const parts = match[2].split(/ *, */).map(Number);

    if (parts.length === expected_part_count) {
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: has_alpha ? parts[3] * 100 : ALPHA_MAX
      };
    }
  }
};

/**
 * If `str` is in `hsl()` or `hsla()` format, returns an RGB color (alpha defaults to 100).
 * @param str Input color string
 */
const easy_hsla = (str: string): RGBA | undefined => {
  const match = str.match(/^hsl(a?)\(([\d., ]+)\)$/);
  if (match) {
    const has_alpha = !!match[1];
    const expected_part_count = has_alpha ? 4 : 3;
    const parts = match[2].split(/ *, */).map(Number);

    if (parts.length === expected_part_count) {
      const rgba = hsl_to_rgb({
        h: parts[0],
        s: parts[1],
        l: parts[2]
      }) as RGBA;
      rgba.a = has_alpha ? parts[3] * 100 : ALPHA_MAX;
      return rgba;
    }
  }
};

/**
 * If `str` is in valid 6-digit hex format with # prefix, returns an RGB color (with alpha 100).
 * @param str Input color string
 */
const easy_hex6 = (str: string): RGBA | undefined => {
  if (str[0] === "#" && str.length === 7 && /^#[\da-fA-F]{6}$/.test(str)) {
    return {
      r: parseInt(str.slice(1, 3), 16),
      g: parseInt(str.slice(3, 5), 16),
      b: parseInt(str.slice(5, 7), 16),
      a: ALPHA_MAX
    };
  }
};

/**
 * If `str` is in valid 3-digit hex format with # prefix, returns an RGB color (with alpha 100).
 * @param str Input color string
 */
const easy_hex3 = (str: string): RGBA | undefined => {
  if (str[0] === "#" && str.length === 4 && /^#[\da-fA-F]{3}$/.test(str)) {
    return {
      r: parseInt(str[1] + str[1], 16),
      g: parseInt(str[2] + str[2], 16),
      b: parseInt(str[3] + str[3], 16),
      a: ALPHA_MAX
    };
  }
};
