"use client";

import { Item } from "@radix-ui/react-dropdown-menu";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import clsx from "clsx";
import React from "react";

import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { forwardRef } from "~/utils/forwardRef";

import menuItemStyles from "../common/MenuItem.module.scss";
import rightSlotStyles from "../common/RightSlot.module.scss";
import { MenuItemProps } from "./MenuItem.props";

const MenuItem = forwardRef<MenuItemProps, "div">((props, ref) => {
  const {
    as = "div",
    className,
    decorator,
    rightSlot,
    slot_props,
    children,
    checkAuth,
    onClick,
    onSelect,
    ...rest
  } = props;
  const loggedIn = use_app_selector(select_is_logged_in);
  const shouldLogin = checkAuth && !loggedIn;
  const Component = shouldLogin ? "a" : as;
  const to = (rest as any)?.href
    ? `?to=${encodeURIComponent((rest as any).href)}`
    : "";

  /**
   * Handles click event
   * @param event Click event
   */
  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (shouldLogin) {
      if (isTestEnv()) {
        event.preventDefault(); // Prevent navigation when testing
      }
    } else {
      onClick?.(event);
    }
  };

  /**
   * Handles select event
   * @param event Select event
   */
  const handleSelect = (event: Event): void => {
    if (shouldLogin) {
      if (isTestEnv()) {
        event.preventDefault(); // Prevent navigation when testing
      }
    } else {
      onSelect?.(event);
    }
  };

  return (
    <Item
      {...rest}
      asChild
      className={clsx(menuItemStyles.item, className)}
      onClick={handleClick}
      onSelect={handleSelect}
      ref={ref}
      {...(shouldLogin
        ? {
            href: `/login${to}`
          }
        : {})}
    >
      <Component>
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
    </Item>
  );
});

MenuItem.displayName = "MenuItem";

export { Item as MenuItemUnstyled };
export default MenuItem;
