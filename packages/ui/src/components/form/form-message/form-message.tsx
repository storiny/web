"use client";

import clsx from "clsx";
import React from "react";

import Typography from "src/components/typography";

import { use_form_field } from "../use-form-field";
import styles from "./form-message.module.scss";
import { FormMessageProps } from "./form-message.props";

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  (props, ref) => {
    const { className, children, ...rest } = props;
    const { error, message_id, disabled } = use_form_field();
    const content = error
      ? String((Array.isArray(error) ? error[0] : error).message || "")
      : children;

    if (!content) {
      return null;
    }

    return (
      <Typography
        level={"body3"}
        {...rest}
        className={clsx(styles["form-message"], className)}
        data-disabled={String(disabled)}
        id={message_id}
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
