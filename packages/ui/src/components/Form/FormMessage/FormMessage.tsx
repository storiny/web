"use client";

import clsx from "clsx";
import React from "react";

import { FormMessageProps } from "~/components/Form";
import Typography from "~/components/Typography";

import { useFormField } from "../useFormField";
import styles from "./FormMessage.module.scss";

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  (props, ref) => {
    const { className, children, ...rest } = props;
    const { error, messageId, disabled } = useFormField();
    const content = error ? String(error?.message) : children;

    if (!content) {
      return null;
    }

    return (
      <Typography
        level={"body3"}
        {...rest}
        className={clsx(styles["form-message"], className)}
        data-disabled={String(disabled)}
        id={messageId}
        ref={ref}
        role={"alert"}
      >
        {content}
      </Typography>
    );
  }
);

FormMessage.displayName = "FormMessage";

export default FormMessage;
