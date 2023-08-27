"use client";

import { CheckboxItem, ItemIndicator } from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import React from "react";

import CheckIcon from "~/icons/Check";
import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import rightSlotStyles from "../common/RightSlot.module.scss";
import styles from "./MenuCheckboxItem.module.scss";
import { MenuCheckboxItemProps } from "./MenuCheckboxItem.props";

const MenuCheckboxItem = forwardRef<MenuCheckboxItemProps, "div">(
  (props, ref) => {
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
      <CheckboxItem
        {...rest}
        asChild
        className={clsx(menuItemStyles.item, styles.item, className)}
        ref={ref}
      >
        <Component>
          <ItemIndicator
            {...slotProps?.indicator}
            className={clsx(
              "flex-center",
              styles.indicator,
              slotProps?.indicator?.className
            )}
          >
            <CheckIcon />
          </ItemIndicator>
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
      </CheckboxItem>
    );
  }
);

MenuCheckboxItem.displayName = "MenuCheckboxItem";

export { CheckboxItem as MenuCheckboxItemUnstyled };
export default MenuCheckboxItem;
