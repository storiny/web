"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

import Select from "~/components/Select";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage,
} from "../Form";
import { FormSelectProps } from "./FormSelect.props";

const FormSelect = React.forwardRef<HTMLFieldSetElement, FormSelectProps>(
  (props, ref) => {
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
          fieldState: { invalid, error },
        }): React.ReactElement => (
          <FormItem
            {...formSlotProps?.formItem}
            disabled={disabled}
            ref={ref}
            required={required}
          >
            <FormLabel {...formSlotProps?.label}>{label}</FormLabel>
            <Select
              {...rest}
              color={invalid || error ? "ruby" : rest?.color}
              defaultValue={field.value}
              disabled={disabled}
              onValueChange={field.onChange}
              renderTrigger={(trigger): React.ReactNode => (
                <FormControl {...formSlotProps?.control}>{trigger}</FormControl>
              )}
              required={required}
            >
              {children}
            </Select>
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

FormSelect.displayName = "FormSelect";

export default FormSelect;
