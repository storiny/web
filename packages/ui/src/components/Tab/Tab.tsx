"use client";

import { Trigger } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import { TabsListContext } from "../TabsList";
import styles from "./Tab.module.scss";
import { TabProps } from "./Tab.props";

const Tab = forwardRef<TabProps, "button">((props, ref) => {
  const {
    as: Component = "button",
    size,
    decorator,
    slotProps,
    className,
    children,
    ...rest
  } = props;
  const { size: tabsListSize } = React.useContext(TabsListContext) || {};
  const hasChildren = Boolean(React.Children.count(children));

  return (
    <Trigger
      {...rest}
      asChild
      className={clsx(
        styles.reset,
        "flex-center",
        "t-center",
        styles.tab,
        styles[size || tabsListSize || "md"],
        !hasChildren && styles["icon-only"],
        className
      )}
      ref={ref}
    >
      <Component>
        {decorator && hasChildren ? (
          <span
            {...slotProps?.decorator}
            className={clsx(
              "flex-center",
              styles.decorator,
              slotProps?.decorator?.className
            )}
          >
            {decorator}
          </span>
        ) : null}
        {hasChildren ? children : decorator}
      </Component>
    </Trigger>
  );
});

Tab.displayName = "Tab";

export default Tab;
