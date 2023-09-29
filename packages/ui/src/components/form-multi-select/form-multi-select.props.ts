import React from "react";

import {
  FormHelperTextProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps
} from "~/components/form";
import { MultiSelectProps } from "src/components/multi-select";

export interface FormMultiSelectProps extends Omit<MultiSelectProps, "ref"> {
  /**
   * The props passed to the individual form elements.
   */
  form_slot_props?: {
    control?: React.ComponentPropsWithoutRef<"button">;
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
  label: React.ReactNode;
  /**
   * The name of the form element.
   */
  name: string;
}
