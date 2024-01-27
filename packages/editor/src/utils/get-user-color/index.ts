import { clamp } from "~/utils/clamp";

type Bound = [number, number];

const SATURATION_BOUND: Bound = [0, 100];
const LIGHTNESS_BOUND: Bound = [0, 100];

/**
 * Generates a hash from the string
 * @param str String
 */
const hash_code = (str: string): number => {
  const len = str.length;
  let hash = 0;

  for (let i = 0; i < len; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash &= hash; // Convert to 32-bit integer
  }

  return hash;
};

/**
 * Clamps `num` within the inclusive `range` bounds
 * @param num Number
 * @param range Range
 */
const bound_hash_code = (num: number, range: number | number[]): number =>
  typeof range === "number"
    ? range
    : (num % Math.abs(range[1] - range[0])) + range[0];

/**
 * Sanitizes a integral `range`
 * @param range Range
 * @param bound Bound
 */
const sanitize_range = (
  range: number | number[],
  bound: Bound
): number | Bound => {
  const [min, max] = bound;

  if (typeof range === "number") {
    return clamp(min, Math.abs(range), max);
  }

  if (range.length === 1 || range[0] === range[1]) {
    return clamp(min, Math.abs(range[0]), max);
  }

  return [
    Math.abs(clamp(min, range[0], max)),
    clamp(min, Math.abs(range[1]), max)
  ];
};

/**
 * Converts HSLA to hex color representation.
 * @param h Hue
 * @param s Saturation
 * @param l Lightness
 * @param a Alpha
 */
const hsla_to_hex = (h: number, s: number, l: number, a: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r: string | number = 0;
  let g: string | number = 0;
  let b: string | number = 0;
  let alpha = "";

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255).toString(16);
  g = Math.round((g + m) * 255).toString(16);
  b = Math.round((b + m) * 255).toString(16);

  if (r.length === 1) {
    r = "0" + r;
  }

  if (g.length === 1) {
    g = "0" + g;
  }

  if (b.length === 1) {
    b = "0" + b;
  }

  if (a !== 100) {
    alpha = Math.round((a / 100) * 255).toString(16);

    if (alpha.length === 1) {
      alpha = "0" + alpha;
    }
  }

  return `#${r}${g}${b}${alpha}`;
};

/**
 * Generates a unique color from the text value
 * @param value Value to generate the color from
 * @param saturation Saturation bounds
 * @param lightness Lightness bounds
 * @param alpha The alpha value
 */
export const get_user_color = (
  value: string,
  {
    saturation = [50, 55],
    lightness = [50, 60]
  }: { lightness?: [number, number]; saturation?: [number, number] } = {},
  alpha = 100
): string => {
  const hash = Math.abs(hash_code(String(value)));
  const h = bound_hash_code(hash, [0, 360]);
  const s = bound_hash_code(hash, sanitize_range(saturation, SATURATION_BOUND));
  const l = bound_hash_code(hash, sanitize_range(lightness, LIGHTNESS_BOUND));

  return hsla_to_hex(h, s, l, alpha);
};
