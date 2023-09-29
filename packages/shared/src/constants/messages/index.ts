import { capitalize } from "@storiny/ui/src/utils/capitalize";

/**
 * Error messages used during client-side schema validation
 */
export const ZOD_MESSAGES = {
  /**
   * Non-empty fields
   * @param field Field name
   */
  non_empty: (field: string): string =>
    `${capitalize(field)} should not be empty`,
  /**
   * String fields with a minimum length
   * @param field Field name
   * @param min_length Minimum length of the field
   * @param type Data type of the field
   */
  min: (
    field: string,
    min_length: number,
    type: "string" | "number" = "string"
  ): string =>
    type === "number"
      ? `${capitalize(field)} must be greater than ${min_length}`
      : `${capitalize(field)} must contain at least ${min_length} ${
          min_length === 1 ? "character" : "characters"
        }`,
  /**
   * String fields with a maximum length
   * @param field Field name
   * @param max_length Maximum length of the field
   * @param type Data type of the field
   */
  max: (
    field: string,
    max_length: number,
    type: "string" | "number" = "string"
  ): string =>
    type === "number"
      ? `${capitalize(field)} must be less than ${max_length}`
      : `${capitalize(field)} must contain at most ${max_length} ${
          max_length === 1 ? "character" : "characters"
        }`
};
