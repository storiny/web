"use client";

import { USER_PROPS } from "@storiny/shared";
import React from "react";

import FormInput from "~/components/form-input";
import IconButton from "~/components/icon-button";
import EyeIcon from "~/icons/eye";
import EyeClosedIcon from "~/icons/eye-closed";

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
      maxLength={USER_PROPS.password.max_length}
      minLength={USER_PROPS.password.min_length}
      name={name}
      ref={ref}
      type={visible ? "text" : "password"}
    />
  );
});

FormPasswordInput.displayName = "FormPasswordInput";

export default FormPasswordInput;
