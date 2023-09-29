"use client";

import { CheckboxItem, ItemIndicator } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import CheckIcon from "src/icons/check";
import { forward_ref } from "src/utils/forward-ref";

import menu_item_styles from "../common/menu-item.module.scss";
import right_slot_styles from "../common/right-slot.module.scss";
import styles from "./menubar-checkbox-item.module.scss";
import { MenubarCheckboxItemProps } from "./menubar-checkbox-item.props";

const MenubarCheckboxItem = forward_ref<MenubarCheckboxItemProps, "div">(
  (props, ref) => {
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
      <CheckboxItem
        {...rest}
        asChild
        className={clsx(menu_item_styles.item, styles.item, className)}
        ref={ref}
      >
        <Component>
          <ItemIndicator
            {...slot_props?.indicator}
            className={clsx(
              "flex-center",
              styles.indicator,
              slot_props?.indicator?.className
            )}
          >
            <CheckIcon />
          </ItemIndicator>
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
      </CheckboxItem>
    );
  }
);

MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

export { CheckboxItem as MenubarCheckboxItemUnstyled };
export default MenubarCheckboxItem;
