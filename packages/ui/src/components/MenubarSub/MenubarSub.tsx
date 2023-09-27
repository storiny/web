"use client";

import { Portal, Sub, SubContent, SubTrigger } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import ChevronIcon from "~/icons/Chevron";
import { forwardRef } from "~/utils/forwardRef";

import menuStyles from "../common/Menu.module.scss";
import menuItemStyles from "../common/MenuItem.module.scss";
import rightSlotStyles from "../common/RightSlot.module.scss";
import styles from "./MenubarSub.module.scss";
import { MenubarSubProps } from "./MenubarSub.props";

const MenubarSub = forwardRef<MenubarSubProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    slot_props,
    ...rest
  } = props;

  return (
    <Sub {...rest}>
      <SubTrigger
        {...slot_props?.trigger}
        className={clsx(menuItemStyles.item, slot_props?.trigger?.className)}
      >
        {trigger}
        <span
          className={clsx(rightSlotStyles["right-slot"], styles["right-slot"])}
        >
          <ChevronIcon rotation={90} />
        </span>
      </SubTrigger>
      <Portal {...slot_props?.portal}>
        <SubContent
          alignOffset={-5}
          collisionPadding={8}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(
            menuStyles.content,
            menuStyles["sub-content"],
            menuStyles.md,
            className
          )}
          ref={ref}
        >
          <Component>{children}</Component>
        </SubContent>
      </Portal>
    </Sub>
  );
});

MenubarSub.displayName = "MenubarSub";

export default MenubarSub;
