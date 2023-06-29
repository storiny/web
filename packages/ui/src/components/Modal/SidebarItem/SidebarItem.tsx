"use client";

import { Trigger } from "@radix-ui/react-tabs";
import clsx from "clsx";
import React from "react";

import { ModalSidebarItemProps } from "~/components/Modal";

import styles from "./SidebarItem.module.scss";

const ModalSidebarItem = React.forwardRef<
  HTMLButtonElement,
  ModalSidebarItemProps
>((props, ref) => {
  const { decorator, slotProps, className, children, ...rest } = props;

  return (
    <Trigger
      {...rest}
      className={clsx(
        styles.reset,
        "flex-center",
        "focusable",
        styles["sidebar-item"],
        className
      )}
      ref={ref}
    >
      {decorator && (
        <span
          {...slotProps?.decorator}
          className={clsx(
            "flex-center",
            styles.decorator,
            slotProps?.decorator?.className
          )}
        >
          {decorator}
        </span>
      )}
      {children}
    </Trigger>
  );
});

ModalSidebarItem.displayName = "ModalSidebarItem";

export default ModalSidebarItem;
