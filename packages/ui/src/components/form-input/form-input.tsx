"use client";

import React from "react";

import Input from "~/components/input";

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
import { FormInputProps } from "./form-input.props";

const FormInput = React.forwardRef<HTMLFieldSetElement, FormInputProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabled_prop,
      required,
      label,
      type = "text",
      helper_text,
      form_slot_props,
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
            {label && (
              <FormLabel {...form_slot_props?.label}>{label}</FormLabel>
            )}
            <FormControl {...form_slot_props?.control}>
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

FormInput.displayName = "FormInput";

export default FormInput;
