"use client";

import clsx from "clsx";
import React from "react";
import Typography from "src/components/typography";
import { forward_ref } from "src/utils/forward-ref";

import MoodSmile from "src/icons/mood-smile";

import styles from "./status.module.scss";
import { StatusProps } from "./status.props";

const Status = forward_ref<StatusProps, "span">((props, ref) => {
  const {
    editable,
    as: Component = editable ? "button" : "span",
    text,
    emoji,
    expires_at,
    className,
    ...rest
  } = props;
  const has_emoji = typeof emoji !== "undefined";
  const has_text = Boolean(text);

  return (
    <Component
      {...rest}
      className={clsx(
        "unset",
        "flex-center",
        "focusable",
        styles.status,
        editable && styles.editable,
        has_text && styles["has-text"],
        className
      )}
      ref={ref}
    >
      {has_emoji || editable ? (
        <span
          className={clsx(
            "flex-center",
            styles.emoji,
            has_emoji && styles["has-emoji"]
          )}
          {...(has_emoji
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
          {!has_emoji && <MoodSmile />}
        </span>
      ) : null}
      {has_text || editable ? (
        <Typography as={"span"} className={clsx(styles.text)} level={"body2"}>
          {has_text ? text : "Set a status"}
        </Typography>
      ) : null}
      {expires_at && (
        <Typography
          as={"span"}
          className={clsx(styles["expiration-time"])}
          level={"body2"}
        >
          {expires_at}
        </Typography>
      )}
    </Component>
  );
});

Status.displayName = "Status";

export default Status;
