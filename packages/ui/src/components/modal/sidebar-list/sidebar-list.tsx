"use client";

import clsx from "clsx";
import React from "react";

import { ModalSidebarListProps } from "~/components/modal";

import TabsList from "../../tabs-list";
import styles from "./sidebar-list.module.scss";

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
