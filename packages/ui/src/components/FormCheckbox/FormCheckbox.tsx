"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

import Checkbox from "~/components/Checkbox";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormMessage
} from "../Form";
import { FormCheckboxProps } from "./FormCheckbox.props";

const FormCheckbox = React.forwardRef<HTMLFieldSetElement, FormCheckboxProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabledProp,
      required,
      label,
      helperText,
      formSlotProps,
      inverted,
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
            <FormControl {...formSlotProps?.control}>
              <Checkbox
                {...rest}
                checked={inverted ? !field.value : field.value}
                color={invalid || error ? "ruby" : rest?.color}
                disabled={disabled}
                label={label}
                onCheckedChange={(checked): void => {
                  const nextChecked = inverted ? !checked : checked;
                  field.onChange(nextChecked);
                  rest?.onCheckedChange?.(nextChecked);
                }}
                required={required}
                slot_props={{
                  ...rest?.slot_props,
                  label: formSlotProps?.label
                }}
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

FormCheckbox.displayName = "FormCheckbox";

export default FormCheckbox;
