"use client";

import clsx from "clsx";
import { Tabs } from "radix-ui";
import React from "react";

import { ModalSidebarItemProps } from "~/components/modal";
import css from "~/theme/main.module.scss";

import styles from "./sidebar-item.module.scss";

const ModalSidebarItem = React.forwardRef<
  HTMLButtonElement,
  ModalSidebarItemProps
>((props, ref) => {
  const { decorator, slot_props, className, children, ...rest } = props;
  return (
    <Tabs.Trigger
      {...rest}
      className={clsx(
        styles.reset,
        css["focusable"],
        styles["sidebar-item"],
        className
      )}
      ref={ref}
    >
      {decorator && (
        <span
          {...slot_props?.decorator}
          className={clsx(
            css["flex-center"],
            styles.decorator,
            slot_props?.decorator?.className
          )}
        >
          {decorator}
        </span>
      )}
      {children}
    </Tabs.Trigger>
  );
});

ModalSidebarItem.displayName = "ModalSidebarItem";

export default ModalSidebarItem;
