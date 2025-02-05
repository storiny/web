"use client";

import clsx from "clsx";
import { Tabs } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import { TabsListContext } from "../tabs-list";
import styles from "./tab.module.scss";
import { TabProps } from "./tab.props";

const Tab = forward_ref<TabProps, "button">((props, ref) => {
  const {
    as: Component = "button",
    size,
    decorator,
    slot_props,
    className,
    children,
    ...rest
  } = props;
  const { size: tabs_list_size } = React.useContext(TabsListContext) || {};
  const has_children = Boolean(React.Children.count(children));

  return (
    <Tabs.Trigger
      {...rest}
      asChild
      className={clsx(
        styles.reset,
        css["flex-center"],
        css["t-center"],
        styles.tab,
        styles[size || tabs_list_size || "md"],
        !has_children && styles["icon-only"],
        className
      )}
      ref={ref}
    >
      <Component>
        {decorator && has_children ? (
          <span
            {...slot_props?.decorator}
            className={clsx(
              css["flex-center"],
              styles.decorator,
              slot_props?.decorator?.className
            )}
          >
            {decorator}
          </span>
        ) : null}
        {has_children ? children : decorator}
      </Component>
    </Tabs.Trigger>
  );
});

Tab.displayName = "Tab";

export default Tab;
