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
  return `hsla(${h},${s}%,${l}%,${alpha}%)`;
};
