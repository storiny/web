import React from "react";

import { use_form_context } from ".";
import { FormFieldContext, FormFieldContextValue } from "./form-field";
import { FormItemContext, FormItemContextValue } from "./form-item";

type FieldState = ReturnType<
  ReturnType<typeof use_form_context>["getFieldState"]
>;

export type FormFieldObject = FieldState &
  FormFieldContextValue &
  FormItemContextValue & {
    helper_text_id: string;
    id: string;
    item_id: string;
    message_id: string;
  };

/**
 * Hook to access form field props
 * @param do_not_throw Flag to disable throwing on missing context
 */
export const use_form_field = (
  do_not_throw?: boolean
): Partial<FormFieldObject> => {
  const field_context = React.useContext(FormFieldContext);
  const item_context = React.useContext(FormItemContext);
  const { getFieldState: get_field_state, formState: form_state } =
    use_form_context() || {};

  if (!field_context || !item_context) {
    if (do_not_throw) {
      return {};
    }

    throw new Error("`use_form_field` must be used within <FormField>");
  }

  const field_state = get_field_state?.(field_context.name, form_state);
  const { id } = item_context;

  if (!id) {
    return {};
  }

  return {
    item_id: `${id}-item`,
    helper_text_id: `${id}-helper-text`,
    message_id: `${id}-message`,
    ...field_state,
    ...field_context,
    ...item_context
  };
};
