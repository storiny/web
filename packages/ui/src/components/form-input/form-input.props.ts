import React from "react";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/form";
import { InputProps } from "src/components/input";

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
   * The label for the form component.
   */
  label?: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
