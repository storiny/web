"use client";

import { userProps } from "@storiny/shared";
import React from "react";

import FormInput from "~/components/FormInput";
import IconButton from "~/components/IconButton";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";

import { FormPasswordInputProps } from "./FormPasswordInput.props";

const FormPasswordInput = React.forwardRef<
  HTMLFieldSetElement,
  FormPasswordInputProps
>((props, ref) => {
  const { name, label, ...rest } = props;
  const [visible, setVisible] = React.useState<boolean>(false);

  /**
   * Toggles visibility
   */
  const toggleVisibility = (): void => {
    setVisible((prevState) => !prevState);
  };

  return (
    <FormInput
      {...rest}
      autoComplete={"current-password"}
      endDecorator={
        <IconButton
          aria-label={`${visible ? "Hide" : "Show"} password`}
          onClick={toggleVisibility}
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
