"use client";

import { Root } from "@radix-ui/react-label";
import React from "react";

import Label from "src/components/label";

import { use_form_field } from "../use-form-field";
import { FormLabelProps } from "./form-label.props";

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    const { item_id, disabled, required } = use_form_field();
    return (
      <Root {...rest} asChild htmlFor={item_id} ref={ref}>
        <Label disabled={disabled} required={required}>
          {children}
        </Label>
      </Root>
    );
  }
);

FormLabel.displayName = "FormLabel";

export default FormLabel;
