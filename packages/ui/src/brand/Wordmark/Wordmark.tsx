"use client";

import clsx from "clsx";
import React from "react";

import Logo from "~/brand/Logo";
import Typography from "~/components/Typography";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Wordmark.module.scss";
import { WordmarkProps, WordmarkSize } from "./Wordmark.props";

const logoSizeMap: Record<WordmarkSize, number> = {
  sm: 26,
  md: 34,
  lg: 56,
};

const Wordmark = forwardRef<WordmarkProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    size = "md",
    showBeta,
    componentProps,
    className,
    ...rest
  } = props;

  return (
    <Component
      {...rest}
      className={clsx("flex-center", styles.wordmark, styles[size], className)}
      ref={ref}
    >
      <Logo {...componentProps?.logo} size={logoSizeMap[size]} />
      <Typography
        {...componentProps?.label}
        as={"span"}
        className={clsx(styles.label, componentProps?.label?.className)}
        level={"h4"}
      >
        Storiny
        {showBeta && (
          <Typography
            {...componentProps?.betaLabel}
            className={clsx(styles.beta, componentProps?.betaLabel?.className)}
          >
            Beta
          </Typography>
        )}
      </Typography>
    </Component>
  );
});

Wordmark.displayName = "Wordmark";

export default Wordmark;
