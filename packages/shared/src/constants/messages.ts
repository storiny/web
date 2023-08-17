import { capitalize } from "@storiny/ui/src/utils/capitalize";

/**
 * Error messages used during client-side schema validation
 */
export const ZOD_MESSAGES = {
  /**
   * Non-empty fields
   * @param field Field name
   */
  nonEmpty: (field: string): string =>
    `${capitalize(field)} should not be empty`,
  /**
   * String fields with a minimum length
   * @param field Field name
   * @param minLength Minimum length of the field
   * @param type Data type of the field
   */
  min: (
    field: string,
    minLength: number,
    type: "string" | "number" = "string"
  ): string =>
    type === "number"
      ? `${capitalize(field)} must be greater than ${minLength}`
      : `${capitalize(field)} must contain at least ${minLength} ${
          minLength === 1 ? "character" : "characters"
        }`,
  /**
   * String fields with a maximum length
   * @param field Field name
   * @param minLength maximum length of the field
   * @param type Data type of the field
   */
  max: (
    field: string,
    minLength: number,
    type: "string" | "number" = "string"
  ): string =>
    type === "number"
      ? `${capitalize(field)} must be less than ${minLength}`
      : `${capitalize(field)} must contain at most ${minLength} ${
          minLength === 1 ? "character" : "characters"
        }`
};
