import { RGBA } from "../../../types";
import { ALPHA_MAX } from "../../constants";
import { rgbaToRgbStr } from "../rgbaToRgbStr";
import { rgbToHex } from "../rgbToHex";

/**
 * Converts RGBA to color string
 * @param value RGBA color string
 */
export const rgbaToStr = (value: RGBA): string =>
  value.a < ALPHA_MAX ? rgbaToRgbStr(value) : rgbToHex(value);
