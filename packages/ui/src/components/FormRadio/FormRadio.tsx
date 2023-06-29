"use client";

import React from "react";

import Radio from "~/components/Radio";

import { FormControl, FormItem } from "../Form";
import { FormRadioProps } from "./FormRadio.props";

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
