"use client";

import React from "react";

import Select from "~/components/select";

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
import { FormSelectProps } from "./form-select.props";

const FormSelect = React.forwardRef<HTMLFieldSetElement, FormSelectProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabled_prop,
      required,
      label,
      helper_text,
      form_slot_props,
      children,
      render_trigger = (trigger): React.ReactNode => trigger,
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
            <FormLabel {...form_slot_props?.label}>{label}</FormLabel>
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
                  is_numeric_value ? Number.parseInt(value, 10) : value
                );
              }}
              render_trigger={(trigger): React.ReactNode => (
                <FormControl {...form_slot_props?.control}>
                  {render_trigger(trigger)}
                </FormControl>
              )}
              required={required}
            >
              {children}
            </Select>
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

FormSelect.displayName = "FormSelect";

export default FormSelect;
