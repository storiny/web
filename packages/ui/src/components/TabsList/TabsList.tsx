"use client";

import { TabsList as TabsListPrimitive } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./TabsList.module.scss";
import { TabsListProps } from "./TabsList.props";
import { TabsListContext } from "./TabsListContext";

const TabsList = forwardRef<TabsListProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  return (
    <TabsListContext.Provider value={{ size }}>
      <TabsListPrimitive
        {...rest}
        asChild
        className={clsx(styles["tabs-list"], className)}
        ref={ref}
      >
        <Component>{children}</Component>
      </TabsListPrimitive>
    </TabsListContext.Provider>
  );
});

TabsList.displayName = "TabsList";

export default TabsList;
