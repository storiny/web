"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

import Input from "~/components/Input";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage,
} from "../Form";
import { FormInputProps } from "./FormInput.props";

const FormInput = React.forwardRef<HTMLFieldSetElement, FormInputProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabledProp,
      required,
      label,
      type = "text",
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
          fieldState: { invalid, error },
        }): React.ReactElement => (
          <FormItem
            {...formSlotProps?.formItem}
            disabled={disabled}
            ref={ref}
            required={required}
          >
            <FormLabel {...formSlotProps?.label}>{label}</FormLabel>
            <FormControl {...formSlotProps?.control}>
              <Input
                {...rest}
                color={invalid || error ? "ruby" : rest?.color}
                disabled={disabled}
                required={required}
                type={type}
                {...field}
                onChange={(event): void =>
                  field.onChange(
                    type === "number"
                      ? // Parse integers
                        Number.parseInt(event.target.value, 10)
                      : event.target.value
                  )
                }
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

FormInput.displayName = "FormInput";

export default FormInput;
