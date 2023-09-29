"use client";

import { userProps } from "@storiny/shared";
import React from "react";

import FormInput from "src/components/form-input";
import IconButton from "src/components/icon-button";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";

import { FormPasswordInputProps } from "./form-password-input.props";

const FormPasswordInput = React.forwardRef<
  HTMLFieldSetElement,
  FormPasswordInputProps
>((props, ref) => {
  const { name, label, ...rest } = props;
  const [visible, set_visible] = React.useState<boolean>(false);

  /**
   * Toggles visibility
   */
  const toggle_visibility = (): void => {
    set_visible((prev_state) => !prev_state);
  };

  return (
    <FormInput
      {...rest}
      autoComplete={"current-password"}
      end_decorator={
        <IconButton
          aria-label={`${visible ? "Hide" : "Show"} password`}
          onClick={toggle_visibility}
          title={`${visible ? "Hide" : "Show"} password`}
        >
          {visible ? <EyeClosedIcon /> : <EyeIcon />}
        </IconButton>
      }
      label={label}
      maxLength={userProps.password.maxLength}
      minLength={userProps.password.minLength}
      name={name}
      ref={ref}
      type={visible ? "text" : "password"}
    />
  );
});

FormPasswordInput.displayName = "FormPasswordInput";

export default FormPasswordInput;
