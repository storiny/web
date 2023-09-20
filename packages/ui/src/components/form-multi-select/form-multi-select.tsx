"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

import MultiSelect from "~/components/MultiSelect";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage
} from "../Form";
import { FormMultiSelectProps } from "./form-multi-select.props";

const FormMultiSelect = React.forwardRef<
  HTMLFieldSetElement,
  FormMultiSelectProps
>((props, ref) => {
  const {
    name,
    disabled: disabledProp,
    required,
    label,
    helperText,
    formSlotProps,
    children,
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
            <MultiSelect
              {...rest}
              color={invalid || error ? "ruby" : rest?.color}
              disabled={disabled}
              onChange={(values): void => field.onChange(values)}
              required={required}
              value={field.value}
            >
              {children}
            </MultiSelect>
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

FormMultiSelect.displayName = "FormMultiSelect";

export default FormMultiSelect;
