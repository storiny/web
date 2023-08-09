"use client";

import clsx from "clsx";
import React from "react";

import { FormHelperTextProps } from "~/components/Form";
import Typography from "~/components/Typography";

import { useFormField } from "../useFormField";

const FormHelperText = React.forwardRef<
  HTMLParagraphElement,
  FormHelperTextProps
>((props, ref) => {
  const { className, ...rest } = props;
  const { helperTextId, disabled } = useFormField();

  return (
    <Typography
      level={"body3"}
      {...rest}
      className={clsx(disabled ? "t-muted" : "t-minor", className)}
      id={helperTextId}
      ref={ref}
    />
  );
});

FormHelperText.displayName = "FormHelperText";

export default FormHelperText;
