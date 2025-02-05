"use client";

import clsx from "clsx";
import { DropdownMenu } from "radix-ui";
import React from "react";

import CheckIcon from "~/icons/check";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import menu_item_styles from "../common/menu-item.module.scss";
import right_slot_styles from "../common/right-slot.module.scss";
import styles from "./menu-checkbox-item.module.scss";
import { MenuCheckboxItemProps } from "./menu-checkbox-item.props";

const MenuCheckboxItem = forward_ref<MenuCheckboxItemProps, "div">(
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
      <DropdownMenu.CheckboxItem
        {...rest}
        asChild
        className={clsx(menu_item_styles.item, styles.item, className)}
        ref={ref}
      >
        <Component>
          <DropdownMenu.ItemIndicator
            {...slot_props?.indicator}
            className={clsx(
              css["flex-center"],
              styles.indicator,
              slot_props?.indicator?.className
            )}
          >
            <CheckIcon />
          </DropdownMenu.ItemIndicator>
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
      </DropdownMenu.CheckboxItem>
    );
  }
);

MenuCheckboxItem.displayName = "MenuCheckboxItem";

export const MenuCheckboxItemUnstyled = DropdownMenu.CheckboxItem;
export default MenuCheckboxItem;
