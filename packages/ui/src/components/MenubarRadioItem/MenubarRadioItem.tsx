"use client";

import { ItemIndicator, RadioItem } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import PointIcon from "~/icons/Point";
import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import styles from "./MenubarRadioItem.module.scss";
import { MenubarRadioItemProps } from "./MenubarRadioItem.props";

const MenubarRadioItem = forwardRef<MenubarRadioItemProps, "div">(
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
      <RadioItem
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
            <PointIcon />
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
      </RadioItem>
    );
  }
);

MenubarRadioItem.displayName = "MenubarRadioItem";

export { RadioItem as MenubarRadioItemUnstyled };
export default MenubarRadioItem;
