// noinspection SuspiciousTypeOfGuard

import { clamp } from "~/utils/clamp";

import { RGBA } from "../../../types";
import { ALPHA_MAX } from "../../constants";

/**
 * Converts an RGBA object to RGB(A) string
 * @param r Red
 * @param g Green
 * @param b Blue
 * @param a Alpha
 */
export const rgbaToRgbStr = ({ r, g, b, a }: RGBA): string =>
  typeof a === "number" && !isNaN(a)
    ? `rgba(${r}, ${g}, ${b}, ${clamp(0, a, ALPHA_MAX) / 100})`
    : `rgb(${r}, ${g}, ${b})`;
