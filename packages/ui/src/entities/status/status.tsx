"use client";

import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Grow from "~/components/grow";
import Typography from "~/components/typography";
import MoodSmile from "~/icons/mood-smile";
import css from "~/theme/main.module.scss";
import { DateFormat, format_date } from "~/utils/format-date";
import { forward_ref } from "~/utils/forward-ref";

import button_styles from "../../components/common/button-reset.module.scss";
import styles from "./status.module.scss";
import { StatusProps } from "./status.props";

const StatusModal = dynamic(() => import("./modal"));

const ExpiryTime = ({
  expires_at
}: {
  expires_at: string;
}): React.ReactElement => {
  const [remaining_time, set_remaining_time] = React.useState(
    format_date(expires_at, DateFormat.STATUS_EXPIRY)
  );

  React.useEffect(() => {
    // Update every minute.
    const interval = setInterval(
      () =>
        set_remaining_time(format_date(expires_at, DateFormat.STATUS_EXPIRY)),
      60_000
    );

    return () => {
      clearInterval(interval);
    };
  }, [expires_at]);

  return (
    <Typography
      as={"span"}
      className={clsx(styles["expiration-time"])}
      level={"body2"}
    >
      {remaining_time}
    </Typography>
  );
};

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
        button_styles.reset,
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
        <Typography
          as={"span"}
          className={clsx(css["ellipsis"], styles.text)}
          level={"body2"}
          title={text || undefined}
        >
          {has_text ? text : "Set a status"}
        </Typography>
      ) : null}
      <Grow />
      {expires_at && <ExpiryTime expires_at={expires_at} />}
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
