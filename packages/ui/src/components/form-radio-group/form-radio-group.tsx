"use client";

import React from "react";

import RadioGroup from "~/components/radio-group";

import { use_form_context } from "../form";
import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage
} from "../form";
import { FormRadioGroupProps } from "./form-radio-group.props";

const FormRadioGroup = React.forwardRef<
  HTMLFieldSetElement,
  FormRadioGroupProps
>((props, ref) => {
  const {
    name,
    disabled: disabled_prop,
    required,
    label,
    helper_text,
    children,
    form_slot_props,
    is_numeric_value,
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
          {label && <FormLabel {...form_slot_props?.label}>{label}</FormLabel>}
          <FormControl {...form_slot_props?.control}>
            <RadioGroup
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
                  is_numeric_value ? Number.parseInt(value, 10) : value
                );
                rest?.onValueChange?.(value);
              }}
            >
              {children}
            </RadioGroup>
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
});

FormRadioGroup.displayName = "FormRadioGroup";

export default FormRadioGroup;
