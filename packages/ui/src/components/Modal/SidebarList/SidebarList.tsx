"use client";

import clsx from "clsx";
import React from "react";

import { ModalSidebarListProps } from "~/components/Modal";

import TabsList from "../../TabsList";
import styles from "./SidebarList.module.scss";

const ModalSidebarList = React.forwardRef<
  HTMLDivElement,
  ModalSidebarListProps
>(({ className, ...rest }, ref) => (
  <TabsList
    {...rest}
    className={clsx(styles["sidebar-list"], className)}
    ref={ref}
  />
));

ModalSidebarList.displayName = "ModalSidebarList";

export default ModalSidebarList;
