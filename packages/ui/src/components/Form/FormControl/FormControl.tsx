"use client";

import { Slot } from "@radix-ui/react-slot";
import React from "react";

import { FormControlProps } from "~/components/Form";

import { useFormField } from "../useFormField";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  FormControlProps
>((props, ref) => {
  const { error, itemId, helperTextId, messageId } = useFormField();

  return (
    <Slot
      {...props}
      aria-describedby={
        error ? `${helperTextId} ${messageId}` : `${helperTextId}`
      }
      aria-invalid={Boolean(error)}
      id={itemId}
      ref={ref}
    />
  );
});

FormControl.displayName = "FormControl";

export default FormControl;
