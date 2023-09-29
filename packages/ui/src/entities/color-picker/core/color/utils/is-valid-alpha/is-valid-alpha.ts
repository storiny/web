import { ALPHA_MAX } from "../../constants";
import { is_valid_color } from "../is-valid-color";

/**
 * Predicate function for validating alpha values
 * @param value Alpha value
 */
export const is_valid_alpha = (value: string | number | symbol): boolean =>
  is_valid_color(value, ALPHA_MAX);
