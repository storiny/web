"use client";

import { Root } from "@radix-ui/react-label";
import React from "react";

import Label from "~/components/Label";

import { useFormField } from "../useFormField";
import { FormLabelProps } from "./FormLabel.props";

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    const { itemId, disabled, required } = useFormField();

    return (
      <Root {...rest} asChild htmlFor={itemId} ref={ref}>
        <Label disabled={disabled} required={required}>
          {children}
        </Label>
      </Root>
    );
  }
);

FormLabel.displayName = "FormLabel";

export default FormLabel;
