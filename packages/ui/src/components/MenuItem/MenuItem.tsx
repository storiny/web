"use client";

import { Item } from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import { MenuItemProps } from "./MenuItem.props";

const MenuItem = forwardRef<MenuItemProps, "div">((props, ref) => {
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
              menuItemStyles["right-slot"],
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

MenuItem.displayName = "MenuItem";

export { Item as MenuItemUnstyled };
export default MenuItem;
