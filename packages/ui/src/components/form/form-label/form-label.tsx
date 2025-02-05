"use client";

import { Label as LabelPrimitive } from "radix-ui";
import React from "react";

import Label from "~/components/label";

import { use_form_field } from "../use-form-field";
import { FormLabelProps } from "./form-label.props";

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    const { item_id, disabled, required } = use_form_field();
    return (
      <LabelPrimitive.Root {...rest} asChild htmlFor={item_id} ref={ref}>
        <Label disabled={disabled} required={required}>
          {children}
        </Label>
      </LabelPrimitive.Root>
    );
  }
);

FormLabel.displayName = "FormLabel";

export default FormLabel;
