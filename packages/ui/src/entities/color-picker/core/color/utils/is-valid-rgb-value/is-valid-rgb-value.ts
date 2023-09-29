import { RGB_MAX } from "../../constants";
import { is_valid_color } from "../is-valid-color";

/**
 * Predicate function for validating RGB color values
 * @param value RGB value
 */
export const is_valid_rgb_value = (value: string | number | symbol): boolean =>
  is_valid_color(value, RGB_MAX);
