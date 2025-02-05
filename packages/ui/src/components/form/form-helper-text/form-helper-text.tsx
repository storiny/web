"use client";

import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_form_field } from "../use-form-field";
import { FormHelperTextProps } from "./form-helper-text.props";

const FormHelperText = React.forwardRef<
  HTMLParagraphElement,
  FormHelperTextProps
>((props, ref) => {
  const { className, ...rest } = props;
  const { helper_text_id, disabled } = use_form_field();
  return (
    <Typography
      level={"body3"}
      {...rest}
      className={clsx(css[disabled ? "t-muted" : "t-minor"], className)}
      id={helper_text_id}
      ref={ref}
    />
  );
});

FormHelperText.displayName = "FormHelperText";

export default FormHelperText;
