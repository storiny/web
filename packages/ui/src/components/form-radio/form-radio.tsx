"use client";

import React from "react";

import Radio from "~/components/radio";

import { FormControl, FormItem } from "../form";
import { FormRadioProps } from "./form-radio.props";

const FormRadio = React.forwardRef<HTMLButtonElement, FormRadioProps>(
  (props, ref) => (
    <FormItem>
      <FormControl>
        <Radio {...props} ref={ref} />
      </FormControl>
    </FormItem>
  )
);

FormRadio.displayName = "FormRadio";

export default FormRadio;
