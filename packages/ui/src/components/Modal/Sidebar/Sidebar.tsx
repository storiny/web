"use client";

import clsx from "clsx";
import React from "react";

import styles from "./Sidebar.module.scss";
import { ModalSidebarProps } from "./Sidebar.props";

const ModalSidebar = React.forwardRef<HTMLDivElement, ModalSidebarProps>(
  (props, ref) => {
    const { className, children, ...rest } = props;

    return (
      <div {...rest} className={clsx(styles.sidebar, className)} ref={ref}>
        {children}
      </div>
    );
  }
);

ModalSidebar.displayName = "ModalSidebar";

export default ModalSidebar;
