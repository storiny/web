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
  FormMessage
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
      renderTrigger = (trigger): React.ReactNode => trigger,
      isNumericValue,
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
            <Select
              {...rest}
              color={invalid || error ? "ruby" : rest?.color}
              defaultValue={
                typeof field.value !== "undefined"
                  ? String(field.value)
                  : undefined
              }
              disabled={disabled}
              onValueChange={(value): void => {
                field.onChange(
                  isNumericValue ? Number.parseInt(value, 10) : value
                );
              }}
              renderTrigger={(trigger): React.ReactNode => (
                <FormControl {...formSlotProps?.control}>
                  {renderTrigger(trigger)}
                </FormControl>
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
