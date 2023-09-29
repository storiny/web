"use client";

import React from "react";
import { use_form_context } from "../form";

import Textarea from "src/components/textarea";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage
} from "../form";
import { FormTextareaProps } from "./form-textarea.props";

const FormTextarea = React.forwardRef<HTMLFieldSetElement, FormTextareaProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabled_prop,
      required,
      label,
      helper_text,
      form_slot_props,
      ...rest
    } = props;
    const form = use_form_context();
    const form_context = React.useContext(FormContext);
    const disabled = Boolean(form_context.disabled || disabled_prop);

    return (
      <FormField
        control={form.control}
        name={name}
        render={({
          field,
          fieldState: { invalid, error }
        }): React.ReactElement => (
          <FormItem
            {...form_slot_props?.form_item}
            disabled={disabled}
            ref={ref}
            required={required}
          >
            <FormLabel {...form_slot_props?.label}>{label}</FormLabel>
            <FormControl {...form_slot_props?.control}>
              <Textarea
                {...rest}
                color={invalid || error ? "ruby" : rest?.color}
                disabled={disabled}
                required={required}
                {...field}
              />
            </FormControl>
            {helper_text && (
              <FormHelperText {...form_slot_props?.helper_text}>
                {helper_text}
              </FormHelperText>
            )}
            <FormMessage {...form_slot_props?.message} />
          </FormItem>
        )}
      />
    );
  }
);

FormTextarea.displayName = "FormTextarea";

export default FormTextarea;
