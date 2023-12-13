/**
 * Sanitizes an authentication code by removing non-alphanumeric characters from the code.
 * @param code The authentication code.
 */
export const sanitize_authentication_code = (code: string): string =>
  code.replace(/[\W_]+/g, "");
