/**
 * Adds errors from server to form state
 * @param errors Errors from server
 * @param setError setError from form context
 */
export const addServerErrors = <T>(
  errors: { [P in keyof T]?: string[] },
  setError: (
    fieldName: keyof T,
    error: { message: string; type: string }
  ) => void
): void =>
  Object.keys(errors).forEach((key) => {
    setError(key as keyof T, {
      type: "server",
      message: errors[key as keyof T]!.join(". "),
    });
  });
