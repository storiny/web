"use client";

import clsx from "clsx";
import React from "react";

import Typography from "~/components/Typography";
import MoodSmile from "~/icons/MoodSmile";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Status.module.scss";
import { StatusProps } from "./Status.props";

const Status = forwardRef<StatusProps, "span">((props, ref) => {
  const {
    editable,
    as: Component = editable ? "button" : "span",
    text,
    emoji,
    expiresAt,
    className,
    ...rest
  } = props;
  const hasEmoji = typeof emoji !== "undefined";
  const hasText = Boolean(text);

  return (
    <Component
      {...rest}
      className={clsx(
        "unset",
        "flex-center",
        "focusable",
        styles.status,
        editable && styles.editable,
        hasText && styles["has-text"],
        className
      )}
      ref={ref}
    >
      {hasEmoji || editable ? (
        <span
          className={clsx(
            "flex-center",
            styles.emoji,
            hasEmoji && styles["has-emoji"]
          )}
          {...(hasEmoji
            ? {
                "aria-label": "Status emoji",
                role: "img",
                style: {
                  "--emoji": `url("${emoji}")`
                } as React.CSSProperties
              }
            : {
                "aria-hidden": "true"
              })}
        >
          {!hasEmoji && <MoodSmile />}
        </span>
      ) : null}
      {hasText || editable ? (
        <Typography as={"span"} className={clsx(styles.text)} level={"body2"}>
          {hasText ? text : "Set a status"}
        </Typography>
      ) : null}
      {expiresAt && (
        <Typography
          as={"span"}
          className={clsx(styles["expiration-time"])}
          level={"body2"}
        >
          {expiresAt}
        </Typography>
      )}
    </Component>
  );
});

Status.displayName = "Status";

export default Status;
