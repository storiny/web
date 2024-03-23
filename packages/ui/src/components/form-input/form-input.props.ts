import React from "react";
import { ControllerRenderProps, FieldValues } from "react-hook-form";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/form";
import { InputProps } from "~/components/input";

export interface FormInputProps extends InputProps {
  /**
   * The props passed to the individual form elements.
   */
  form_slot_props?: {
    control?: React.ComponentPropsWithoutRef<"input">;
    form_item?: FormItemProps;
    helper_text?: FormHelperTextProps;
    label?: FormLabelProps;
    message?: FormMessageProps;
  };
  /**
   * The helper text content placed below the control.
   */
  helper_text?: React.ReactNode;
  /**
   * Predicate function for determining whether the input is disabled based on the field object.
   * @param field
   */
  is_field_disabled?: (
    field: ControllerRenderProps<FieldValues, string>
  ) => boolean;
  /**
   * The label for the form component.
   */
  label?: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
