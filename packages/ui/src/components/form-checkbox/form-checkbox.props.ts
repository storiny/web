import React from "react";

import { CheckboxProps } from "~/components/checkbox";
import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/form";

export interface FormCheckboxProps extends Omit<CheckboxProps, "ref"> {
  /**
   * The props passed to the individual form elements.
   */
  form_slot_props?: {
    control?: React.ComponentPropsWithoutRef<"input" | "button">;
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
