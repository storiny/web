"use client";

import { Root } from "@radix-ui/react-label";
import clsx from "clsx";
import React from "react";

import styles from "./Label.module.scss";
import { LabelProps } from "./Label.props";

const Label = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const { className, children, disabled, required, ...rest } = props;
  return (
    <Root
      {...rest}
      className={clsx("flex", styles.label, className)}
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
