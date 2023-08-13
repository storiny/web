import React from "react";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/Form";
import { RadioGroupProps } from "~/components/RadioGroup";

export interface FormRadioGroupProps extends RadioGroupProps {
  /**
   * The props passed to the individual form elements.
   */
  formSlotProps?: {
    control?: React.ComponentPropsWithoutRef<"div">;
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
