"use client";

import clsx from "clsx";
import React from "react";

import { AvatarGroupContext } from "~/components/AvatarGroup/AvatarGroupContext";
import { forwardRef } from "~/utils/forwardRef";

import Avatar from "../Avatar";
import commonStyles from "../common/AvatarSize.module.scss";
import styles from "./AvatarGroup.module.scss";
import { AvatarGroupProps } from "./AvatarGroup.props";

const AvatarGroup = forwardRef<AvatarGroupProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    className,
    children,
    slot_props,
    ...rest
  } = props;
  const childAvatars = React.Children.toArray(children).reverse();
  const overflowCount = childAvatars.length - 3;

  return (
    <AvatarGroupContext.Provider value={{ size }}>
      <Component
        {...rest}
        className={clsx(
          "fit-w",
          styles["avatar-group"],
          styles[size],
          commonStyles[size],
          className
        )}
        ref={ref}
      >
        {/* Show a maximum of 3 avatars */}
        {childAvatars.length > 3 && (
          <Avatar
            {...slot_props?.overflow}
            alt={`${overflowCount} more people`}
          >
            +{Math.min(overflowCount, 9)}
          </Avatar>
        )}
        {childAvatars.slice(-3)}
      </Component>
    </AvatarGroupContext.Provider>
  );
});

AvatarGroup.displayName = "AvatarGroup";

export default AvatarGroup;
