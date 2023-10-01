"use client";

import { Root } from "@radix-ui/react-label";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./label.module.scss";
import { LabelProps } from "./label.props";

const Label = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const { className, children, disabled, required, ...rest } = props;
  return (
    <Root
      {...rest}
      className={clsx(css["flex"], styles.label, className)}
      data-disabled={String(Boolean(disabled))}
      ref={ref}
    >
      {children}
      {required && <span className={styles.asterisk}>*</span>}
    </Root>
  );
});

Label.displayName = "Label";

export default Label;
