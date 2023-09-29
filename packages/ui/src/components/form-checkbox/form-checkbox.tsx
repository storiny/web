"use client";

import React from "react";

import Checkbox from "~/components/checkbox";

import { use_form_context } from "../form";
import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormMessage
} from "../form";
import { FormCheckboxProps } from "./form-checkbox.props";

const FormCheckbox = React.forwardRef<HTMLFieldSetElement, FormCheckboxProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabled_prop,
      required,
      label,
      helper_text,
      form_slot_props,
      inverted,
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
            <FormControl {...form_slot_props?.control}>
              <Checkbox
                {...rest}
                checked={inverted ? !field.value : field.value}
                color={invalid || error ? "ruby" : rest?.color}
                disabled={disabled}
                label={label}
                onCheckedChange={(checked): void => {
                  const next_checked = inverted ? !checked : checked;
                  field.onChange(next_checked);
                  rest?.onCheckedChange?.(next_checked);
                }}
                required={required}
                slot_props={{
                  ...rest?.slot_props,
                  label: form_slot_props?.label
                }}
              />
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
  }
);

FormCheckbox.displayName = "FormCheckbox";

export default FormCheckbox;
