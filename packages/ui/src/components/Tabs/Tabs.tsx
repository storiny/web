"use client";

import { Root } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Tabs.module.scss";
import { TabsProps } from "./Tabs.props";

const Tabs = forwardRef<TabsProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    orientation = "horizontal",
    children,
    className,
    ...rest
  } = props;

  return (
    <Root
      {...rest}
      asChild
      className={clsx(styles.tabs, styles[orientation], className)}
      orientation={orientation}
      ref={ref}
    >
      <Component>{children}</Component>
    </Root>
  );
});

Tabs.displayName = "Tabs";

export default Tabs;
