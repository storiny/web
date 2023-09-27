"use client";

import { CheckboxItem, ItemIndicator } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import CheckIcon from "~/icons/Check";
import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import rightSlotStyles from "../common/RightSlot.module.scss";
import styles from "./MenubarCheckboxItem.module.scss";
import { MenubarCheckboxItemProps } from "./MenubarCheckboxItem.props";

const MenubarCheckboxItem = forwardRef<MenubarCheckboxItemProps, "div">(
  (props, ref) => {
    const {
      as: Component = "div",
      className,
      decorator,
      rightSlot,
      slot_props,
      children,
      ...rest
    } = props;

    return (
      <CheckboxItem
        {...rest}
        asChild
        className={clsx(menuItemStyles.item, styles.item, className)}
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
                menuItemStyles.decorator,
                slot_props?.decorator?.className
              )}
            >
              {decorator}
            </span>
          )}
          {children}
          {rightSlot && (
            <span
              {...slot_props?.rightSlot}
              className={clsx(
                rightSlotStyles["right-slot"],
                slot_props?.rightSlot?.className
              )}
            >
              {rightSlot}
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
