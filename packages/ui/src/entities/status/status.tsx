"use client";

import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Typography from "~/components/typography";
import MoodSmile from "~/icons/mood-smile";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import styles from "./status.module.scss";
import { StatusProps } from "./status.props";

const StatusModal = dynamic(() => import("./modal"));

const Entity = forward_ref<StatusProps, "span">((props, ref) => {
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
        css["flex-center"],
        css["focusable"],
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
            css["flex-center"],
            styles.emoji,
            has_emoji && styles["has-emoji"]
          )}
          {...(has_emoji
            ? {
                "aria-label": "Status emoji",
                role: "img",
                style: {
                  "--emoji": `url("${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/raw/emojis/${emoji}.svg")`
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

const Status = forward_ref<StatusProps, "span">((props, ref) => {
  const { editable, modal_props, disable_modal, ...rest } = props;

  if (editable && !disable_modal) {
    return (
      <StatusModal
        modal_props={modal_props}
        trigger={({ open_modal }): React.ReactElement => (
          <Entity
            editable={editable}
            {...rest}
            onClick={(event): void => {
              open_modal();
              rest.onClick?.(event);
            }}
            ref={ref}
          />
        )}
      />
    );
  }

  return <Entity editable={editable} {...rest} ref={ref} />;
});

Status.displayName = "Status";

export default Status;
