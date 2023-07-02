"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

import RadioGroup from "~/components/RadioGroup";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage
} from "../Form";
import { FormRadioGroupProps } from "./FormRadioGroup.props";

const FormRadioGroup = React.forwardRef<
  HTMLFieldSetElement,
  FormRadioGroupProps
>((props, ref) => {
  const {
    name,
    disabled: disabledProp,
    required,
    label,
    helperText,
    children,
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
            <RadioGroup
              {...rest}
              color={invalid || error ? "ruby" : rest?.color}
              defaultValue={field.value}
              onValueChange={field.onChange}
            >
              {children}
            </RadioGroup>
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
});

FormRadioGroup.displayName = "FormRadioGroup";

export default FormRadioGroup;
