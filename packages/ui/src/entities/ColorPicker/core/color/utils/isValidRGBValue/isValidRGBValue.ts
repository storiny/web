import { RGB_MAX } from "../../constants";
import { isValidColor } from "../isValidColor";

/**
 * Predicate function for validating RGB color values
 * @param value RGB value
 */
export const isValidRGBValue = (value: string | number | symbol): boolean =>
  isValidColor(value, RGB_MAX);
