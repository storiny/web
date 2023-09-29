import React from "react";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "src/components/form";
import { RadioGroupProps } from "src/components/radio-group";

export interface FormRadioGroupProps extends RadioGroupProps {
  /**
   * The props passed to the individual form elements.
   */
  form_slot_props?: {
    control?: React.ComponentPropsWithoutRef<"div">;
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
   * If `true`, casts the value as number in the `onChange` event.
   * @default false
   */
  is_numeric_value?: boolean;
  /**
   * The label for the form component.
   */
  label?: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
