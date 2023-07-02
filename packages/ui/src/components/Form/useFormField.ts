import React from "react";
import { useFormContext } from "react-hook-form";

import { FormFieldContext, FormFieldContextValue } from "./FormField";
import { FormItemContext, FormItemContextValue } from "./FormItem";

type FieldState = ReturnType<
  ReturnType<typeof useFormContext>["getFieldState"]
>;

export type FormFieldObject = FieldState &
  FormFieldContextValue &
  FormItemContextValue & {
    helperTextId: string;
    id: string;
    itemId: string;
    messageId: string;
  };

/**
 * Hook to access form field props
 * @param doNotThrow Flag to disable throwing on missing context
 */
export const useFormField = (
  doNotThrow?: boolean
): Partial<FormFieldObject> => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext() || {};

  if (!fieldContext || !itemContext) {
    if (doNotThrow) {
      return {};
    }

    throw new Error("`useFormField` must be used within <FormField>");
  }

  const fieldState = getFieldState?.(fieldContext.name, formState);
  const { id } = itemContext;

  if (!id) {
    return {};
  }

  return {
    itemId: `${id}-item`,
    helperTextId: `${id}-helper-text`,
    messageId: `${id}-message`,
    ...fieldState,
    ...fieldContext,
    ...itemContext
  };
};
