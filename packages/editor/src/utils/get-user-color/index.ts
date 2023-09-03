import { clamp } from "~/utils/clamp";

type Bound = [number, number];

const SATURATION_BOUND: Bound = [0, 100];
const LIGHTNESS_BOUND: Bound = [0, 100];

/**
 * Generates a hash from the string
 * @param str String
 */
const hashCode = (str: string): number => {
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
const boundHashCode = (num: number, range: number | number[]): number =>
  typeof range === "number"
    ? range
    : (num % Math.abs(range[1] - range[0])) + range[0];

/**
 * Sanitizes a integral `range`
 * @param range Range
 * @param bound Bound
 */
const sanitizeRange = (
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
 * @param value Value to generate the color fromm
 * @param saturation Saturation bounds
 * @param lightness Lightness bounds
 */
export const getUserColor = (
  value: string,
  {
    saturation = [50, 55],
    lightness = [50, 60]
  }: { lightness?: [number, number]; saturation?: [number, number] } = {}
): string => {
  const hash = Math.abs(hashCode(String(value)));
  const h = boundHashCode(hash, [0, 360]);
  const s = boundHashCode(hash, sanitizeRange(saturation, SATURATION_BOUND));
  const l = boundHashCode(hash, sanitizeRange(lightness, LIGHTNESS_BOUND));

  return `hsl(${h},${s}%,${l}%)`;
};
