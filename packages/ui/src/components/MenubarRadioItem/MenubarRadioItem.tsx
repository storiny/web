"use client";

import { ItemIndicator, RadioItem } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import PointIcon from "~/icons/Point";
import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import rightSlotStyles from "../common/RightSlot.module.scss";
import styles from "./MenubarRadioItem.module.scss";
import { MenubarRadioItemProps } from "./MenubarRadioItem.props";

const MenubarRadioItem = forwardRef<MenubarRadioItemProps, "div">(
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
      <RadioItem
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
            <PointIcon />
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
      </RadioItem>
    );
  }
);

MenubarRadioItem.displayName = "MenubarRadioItem";

export { RadioItem as MenubarRadioItemUnstyled };
export default MenubarRadioItem;
