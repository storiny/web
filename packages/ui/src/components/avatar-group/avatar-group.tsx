"use client";

import clsx from "clsx";
import React from "react";

import { AvatarGroupContext } from "~/components/avatar-group/avatar-group-context";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import Avatar from "../avatar";
import common_styles from "../common/avatar-size.module.scss";
import styles from "./avatar-group.module.scss";
import { AvatarGroupProps } from "./avatar-group.props";

const MAX_AVATARS = 3; // Maximum avatars to display before they get truncated

const AvatarGroup = forward_ref<AvatarGroupProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    className,
    children,
    slot_props,
    ...rest
  } = props;
  const avatar_children = React.Children.toArray(children).reverse();
  const overflow_count = avatar_children.length - MAX_AVATARS;

  return (
    <AvatarGroupContext.Provider value={{ size }}>
      <Component
        {...rest}
        className={clsx(
          css["fit-w"],
          styles["avatar-group"],
          styles[size],
          common_styles[size],
          className
        )}
        ref={ref}
      >
        {/* Show a maximum of three avatars */}
        {avatar_children.length > MAX_AVATARS && (
          <Avatar
            {...slot_props?.overflow}
            alt={`${overflow_count} more people`}
          >
            +{Math.min(overflow_count, 9)}
          </Avatar>
        )}
        {avatar_children.slice(-MAX_AVATARS)}
      </Component>
    </AvatarGroupContext.Provider>
  );
});

AvatarGroup.displayName = "AvatarGroup";

export default AvatarGroup;
