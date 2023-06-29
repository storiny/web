"use client";

import { Content } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./TabPanel.module.scss";
import { TabPanelProps } from "./TabPanel.props";

const TabPanel = forwardRef<TabPanelProps, "div">((props, ref) => {
  const { as: Component = "div", className, children, ...rest } = props;

  return (
    <Content
      {...rest}
      asChild
      className={clsx(styles["tab-panel"], className)}
      ref={ref}
    >
      <Component>{children}</Component>
    </Content>
  );
});

TabPanel.displayName = "TabPanel";

export default TabPanel;
