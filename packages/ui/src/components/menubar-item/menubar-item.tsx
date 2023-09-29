"use client";

import { Item } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";

import menu_item_styles from "../common/menu-item.module.scss";
import right_slot_styles from "../common/right-slot.module.scss";
import { MenubarItemProps } from "./menubar-item.props";

const MenubarItem = forward_ref<MenubarItemProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    decorator,
    right_slot,
    slot_props,
    children,
    ...rest
  } = props;
  return (
    <Item
      {...rest}
      asChild
      className={clsx(menu_item_styles.item, className)}
      ref={ref}
    >
      <Component>
        {decorator && (
          <span
            {...slot_props?.decorator}
            className={clsx(
              menu_item_styles.decorator,
              slot_props?.decorator?.className
            )}
          >
            {decorator}
          </span>
        )}
        {children}
        {right_slot && (
          <span
            {...slot_props?.right_slot}
            className={clsx(
              right_slot_styles["right-slot"],
              slot_props?.right_slot?.className
            )}
          >
            {right_slot}
          </span>
        )}
      </Component>
    </Item>
  );
});

MenubarItem.displayName = "MenubarItem";

export { Item as MenubarItemUnstyled };
export default MenubarItem;
