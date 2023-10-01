"use client";

import clsx from "clsx";
import React from "react";

import Switch from "~/components/switch";
import css from "~/theme/main.module.scss";

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
import styles from "./form-switch.module.scss";
import { FormSwitchProps } from "./form-switch.props";

const FormSwitch = React.forwardRef<HTMLFieldSetElement, FormSwitchProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabled_prop,
      required,
      label,
      helper_text,
      form_slot_props,
      className,
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
            className={clsx(styles["form-switch"], className)}
            disabled={disabled}
            ref={ref}
            required={required}
          >
            <div
              className={clsx(css["flex"], styles.control)}
              data-disabled={String(Boolean(disabled))}
            >
              <FormLabel
                {...form_slot_props?.label}
                className={clsx(
                  styles.label,
                  form_slot_props?.label?.className
                )}
              >
                {label}
              </FormLabel>
              <FormControl {...form_slot_props?.control}>
                <Switch
                  {...rest}
                  checked={field.value}
                  color={invalid || error ? "ruby" : rest?.color}
                  disabled={disabled}
                  onCheckedChange={(checked): void => {
                    field.onChange(checked);
                    rest?.onCheckedChange?.(checked);
                  }}
                  required={required}
                />
              </FormControl>
            </div>
            <div
              className={clsx(
                css["flex-col"],
                styles["secondary-text-wrapper"]
              )}
            >
              {helper_text && (
                <FormHelperText
                  {...form_slot_props?.helper_text}
                  className={clsx(
                    css["t-minor"],
                    styles["secondary-text"],
                    form_slot_props?.helper_text?.className
                  )}
                >
                  {helper_text}
                </FormHelperText>
              )}
              <FormMessage
                {...form_slot_props?.message}
                className={clsx(
                  styles["secondary-text"],
                  form_slot_props?.message?.className
                )}
              />
            </div>
          </FormItem>
        )}
      />
    );
  }
);

FormSwitch.displayName = "FormSwitch";

export default FormSwitch;
