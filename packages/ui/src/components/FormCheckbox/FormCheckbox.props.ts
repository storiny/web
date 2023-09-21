import React from "react";

import { CheckboxProps } from "~/components/Checkbox";
import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/Form";

export interface FormCheckboxProps extends Omit<CheckboxProps, "ref"> {
  /**
   * The props passed to the individual form elements.
   */
  formSlotProps?: {
    control?: React.ComponentPropsWithoutRef<"input" | "button">;
    formItem?: FormItemProps;
    helperText?: FormHelperTextProps;
    label?: FormLabelProps;
    message?: FormMessageProps;
  };
  /**
   * The helper text content placed below the control.
   */
  helperText?: React.ReactNode;
  /**
   * If `true`, inverts the boolean checked flag.
   * @default false
   */
  inverted?: boolean;
  /**
   * The label for the form component.
   */
  label: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
