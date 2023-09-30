"use client";

import React from "react";

import MultiSelect from "~/components/multi-select";

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
import { FormMultiSelectProps } from "./form-multi-select.props";

const FormMultiSelect = React.forwardRef<
  HTMLFieldSetElement,
  FormMultiSelectProps
>((props, ref) => {
  const {
    name,
    disabled: disabled_prop,
    required,
    label,
    helper_text,
    form_slot_props,
    children,
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

FormMultiSelect.displayName = "FormMultiSelect";

export default FormMultiSelect;
