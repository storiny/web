import React from "react";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/Form";
import { InputProps } from "~/components/Input";

export interface FormInputProps extends InputProps {
  /**
   * The props passed to the individual form elements.
   */
  formSlotProps?: {
    control?: React.ComponentPropsWithoutRef<"input">;
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
   * The label for the form component.
   */
  label?: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
