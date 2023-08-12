"use client";

import clsx from "clsx";
import React from "react";
import { useFormContext } from "react-hook-form";

import Switch from "~/components/Switch";

import {
  FormContext,
  FormControl,
  FormField,
  FormHelperText,
  FormItem,
  FormLabel,
  FormMessage
} from "../Form";
import styles from "./FormSwitch.module.scss";
import { FormSwitchProps } from "./FormSwitch.props";

const FormSwitch = React.forwardRef<HTMLFieldSetElement, FormSwitchProps>(
  (props, ref) => {
    const {
      name,
      disabled: disabledProp,
      required,
      label,
      helperText,
      formSlotProps,
      className,
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
            className={clsx(styles["form-switch"], className)}
            disabled={disabled}
            ref={ref}
            required={required}
          >
            <div
              className={clsx("flex", styles.control)}
              data-disabled={String(Boolean(disabled))}
            >
              <FormLabel
                {...formSlotProps?.label}
                className={clsx(styles.label, formSlotProps?.label?.className)}
              >
                {label}
              </FormLabel>
              <FormControl {...formSlotProps?.control}>
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
            <div className={clsx("flex-col", styles["secondary-text-wrapper"])}>
              {helperText && (
                <FormHelperText
                  {...formSlotProps?.helperText}
                  className={clsx(
                    "t-minor",
                    styles["secondary-text"],
                    formSlotProps?.helperText?.className
                  )}
                >
                  {helperText}
                </FormHelperText>
              )}
              <FormMessage
                {...formSlotProps?.message}
                className={clsx(
                  styles["secondary-text"],
                  formSlotProps?.message?.className
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
