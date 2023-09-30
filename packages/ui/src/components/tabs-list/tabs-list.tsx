"use client";

import { TabsList as TabsListPrimitive } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./tabs-list.module.scss";
import { TabsListProps } from "./tabs-list.props";
import { TabsListContext } from "./tabs-list-context";

const TabsList = forward_ref<TabsListProps, "div">((props, ref) => {
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
