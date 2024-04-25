"use client";

import { Flag, UserFlag } from "@storiny/web/src/common/flags";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { BadgeSkeleton } from "~/entities/badges";
import { forward_ref } from "~/utils/forward-ref";

import styles from "./badge-array.module.scss";
import { BadgeArrayProps } from "./badge-array.props";

const EarlyUserBadge = dynamic(() => import("~/entities/badges/early-user"), {
  loading: () => <BadgeSkeleton />
});

const StaffBadge = dynamic(() => import("~/entities/badges/staff"), {
  loading: () => <BadgeSkeleton />
});

const PlusBadge = dynamic(() => import("~/entities/badges/plus"), {
  loading: () => <BadgeSkeleton />
});

const BadgeArray = forward_ref<BadgeArrayProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    flags: user_flags,
    is_plus_member,
    size = 16,
    style,
    className,
    slot_props,
    ...rest
  } = props;
  const flags = React.useMemo(() => new Flag(user_flags), [user_flags]);

  if (flags.none() && !is_plus_member) {
    return null;
  }

  return (
    <Component
      {...rest}
      className={clsx(styles.array, className)}
      ref={ref}
      style={{
        ...style,
        "--badge-size": `${size}px`
      }}
    >
      {flags.has_any_of(UserFlag.STAFF) && (
        <StaffBadge {...slot_props?.badge} />
      )}
      {flags.has_any_of(UserFlag.EARLY_USER) && (
        <EarlyUserBadge {...slot_props?.badge} />
      )}
      {is_plus_member && <PlusBadge {...slot_props?.badge} />}
    </Component>
  );
});

BadgeArray.displayName = "BadgeArray";

export default BadgeArray;
