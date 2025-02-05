"use client";

import clsx from "clsx";
import React from "react";

import Logo from "~/brand/logo";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import styles from "./wordmark.module.scss";
import { WordmarkProps, WordmarkSize } from "./wordmark.props";

const LOGO_SIZE_MAP: Record<WordmarkSize, number> = {
  sm: 26,
  md: 34,
  lg: 56
};

const Wordmark = forward_ref<WordmarkProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    size = "md",
    component_props,
    className,
    ...rest
  } = props;
  return (
    <Component
      {...rest}
      className={clsx(
        css["fit-w"],
        css["flex-center"],
        styles.wordmark,
        styles[size],
        className
      )}
      ref={ref}
    >
      <Logo {...component_props?.logo} size={LOGO_SIZE_MAP[size]} />
      <Typography
        {...component_props?.label}
        as={"span"}
        className={clsx(styles.label, component_props?.label?.className)}
        level={"h4"}
      >
        Storiny
      </Typography>
    </Component>
  );
});

Wordmark.displayName = "Wordmark";

export default Wordmark;
