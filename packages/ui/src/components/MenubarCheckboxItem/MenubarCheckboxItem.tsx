"use client";

import { CheckboxItem, ItemIndicator } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import CheckIcon from "~/icons/Check";
import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import styles from "./MenubarCheckbox.module.scss";
import { MenubarCheckboxItemProps } from "./MenubarCheckboxItem.props";

const MenubarCheckboxItem = forwardRef<MenubarCheckboxItemProps, "div">(
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
                menuItemStyles["right-slot"],
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

MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

export { CheckboxItem as MenubarCheckboxItemUnstyled };
export default MenubarCheckboxItem;
