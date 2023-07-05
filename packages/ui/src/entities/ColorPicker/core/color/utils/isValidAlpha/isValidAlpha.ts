import { ALPHA_MAX } from "../../constants";
import { isValidColor } from "../isValidColor";

/**
 * Predicate function for validating alpha values
 * @param value Alpha value
 */
export const isValidAlpha = (value: string | number | symbol): boolean =>
  isValidColor(value, ALPHA_MAX);
