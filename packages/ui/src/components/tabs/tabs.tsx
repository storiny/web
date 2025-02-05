"use client";

import clsx from "clsx";
import { Tabs as TabsPrimitive } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./tabs.module.scss";
import { TabsProps } from "./tabs.props";

const Tabs = forward_ref<TabsProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    orientation = "horizontal",
    children,
    className,
    ...rest
  } = props;
  return (
    <TabsPrimitive.Root
      {...rest}
      asChild
      className={clsx(styles.tabs, styles[orientation], className)}
      orientation={orientation}
      ref={ref}
    >
      <Component>{children}</Component>
    </TabsPrimitive.Root>
  );
});

Tabs.displayName = "Tabs";

export default Tabs;
