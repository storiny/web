"use client";
 
import { Slot } from "radix-ui";
import React from "react";

import { FormControlProps } from "~/components/form";

import { use_form_field } from "../use-form-field";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot.Root>,
  FormControlProps
>((props, ref) => {
  const { error, item_id, helper_text_id, message_id } = use_form_field();
  return (
    <Slot.Root
      {...props}
      aria-describedby={
        error ? `${helper_text_id} ${message_id}` : `${helper_text_id}`
      }
      aria-invalid={Boolean(error)}
      id={item_id}
      ref={ref}
    />
  );
});

FormControl.displayName = "FormControl";

export default FormControl;
