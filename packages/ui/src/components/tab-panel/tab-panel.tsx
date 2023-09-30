"use client";

import { Content } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./tab-panel.module.scss";
import { TabPanelProps } from "./tab-panel.props";

const TabPanel = forward_ref<TabPanelProps, "div">((props, ref) => {
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
