"use client";

import { Item } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import rightSlotStyles from "../common/RightSlot.module.scss";
import { MenubarItemProps } from "./MenubarItem.props";

const MenubarItem = forwardRef<MenubarItemProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    decorator,
    rightSlot,
    slotProps,
    children,
    ...rest
  } = props;

  return (
    <Item
      {...rest}
      asChild
      className={clsx(menuItemStyles.item, className)}
      ref={ref}
    >
      <Component>
        {decorator && (
          <span
            {...slotProps?.decorator}
            className={clsx(
              menuItemStyles.decorator,
              slotProps?.decorator?.className
            )}
          >
            {decorator}
          </span>
        )}
        {children}
        {rightSlot && (
          <span
            {...slotProps?.rightSlot}
            className={clsx(
              rightSlotStyles["right-slot"],
              slotProps?.rightSlot?.className
            )}
          >
            {rightSlot}
          </span>
        )}
      </Component>
    </Item>
  );
});

MenubarItem.displayName = "MenubarItem";

export { Item as MenubarItemUnstyled };
export default MenubarItem;
