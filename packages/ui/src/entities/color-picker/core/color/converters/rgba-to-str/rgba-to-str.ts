import { RGBA } from "../../../types";
import { ALPHA_MAX } from "../../constants";
import { rgba_to_rgb_str } from "../rgba-to-rgb-str";
import { rgb_to_hex } from "../rgb-to-hex";

/**
 * Converts RGBA to color string
 * @param value RGBA color string
 */
export const rgba_to_str = (value: RGBA): string =>
  value.a < ALPHA_MAX ? rgba_to_rgb_str(value) : rgb_to_hex(value);
