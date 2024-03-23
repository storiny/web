/**
 * Returns the modified fields from the form state.
 * @param dirty_fields The dirty fields.
 * @param values The values received from react-hook-form.
 */
export const get_form_dirty_fields = <
  DirtyFields extends Record<string, unknown>,
  Values extends Record<keyof DirtyFields, unknown>
>(
  dirty_fields: DirtyFields,
  values: Values
): Partial<typeof values> =>
  Object.keys(dirty_fields).reduce((prev, key) => {
    if (!dirty_fields[key]) {
      return prev;
    }

    return {
      ...prev,
      [key]:
        typeof dirty_fields[key] === "object"
          ? get_form_dirty_fields(
              dirty_fields[key] as DirtyFields,
              values[key] as Values
            )
          : values[key]
    };
  }, {});
