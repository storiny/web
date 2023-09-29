import { HEX, HSV } from "../../../types";
import { hsv_to_rgb } from "../hsv-to-rgb";
import { rgb_to_hex } from "../rgb-to-hex";

/**
 * Converts HSV to HEX
 * @param hsv HSV value
 */
export const hsv_to_hex = (hsv: HSV): HEX => rgb_to_hex(hsv_to_rgb(hsv));
