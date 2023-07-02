"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

import Textarea from "~/components/Textarea";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage
} from "../Form";
import { FormTextareaProps } from "./FormTextarea.props";

const FormTextarea = React.forwardRef<HTMLFieldSetElement, FormTextareaProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabledProp,
      required,
      label,
      helperText,
      formSlotProps,
      ...rest
    } = props;
    const form = useFormContext();
    const formContext = React.useContext(FormContext);
    const disabled = Boolean(formContext.disabled || disabledProp);

    return (
      <FormField
        control={form.control}
        name={name}
        render={({
          field,
          fieldState: { invalid, error }
        }): React.ReactElement => (
          <FormItem
            {...formSlotProps?.formItem}
            disabled={disabled}
            ref={ref}
            required={required}
          >
            <FormLabel {...formSlotProps?.label}>{label}</FormLabel>
            <FormControl {...formSlotProps?.control}>
              <Textarea
                {...rest}
                color={invalid || error ? "ruby" : rest?.color}
                disabled={disabled}
                required={required}
                {...field}
              />
            </FormControl>
            {helperText && (
              <FormHelperText {...formSlotProps?.helperText}>
                {helperText}
              </FormHelperText>
            )}
            <FormMessage {...formSlotProps?.message} />
          </FormItem>
        )}
      />
    );
  }
);

FormTextarea.displayName = "FormTextarea";

export default FormTextarea;
