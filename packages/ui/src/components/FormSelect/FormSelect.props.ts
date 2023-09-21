import React from "react";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/Form";
import { SelectProps } from "~/components/Select";

export interface FormSelectProps extends SelectProps {
  /**
   * The props passed to the individual form elements.
   */
  formSlotProps?: {
    control?: React.ComponentPropsWithoutRef<"button">;
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
   * If `true`, casts the value as number in the `onChange` event.
   * @default false
   */
  isNumericValue?: boolean;
  /**
   * The label for the form component.
   */
  label: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
