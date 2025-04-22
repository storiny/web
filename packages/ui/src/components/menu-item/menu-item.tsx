"use client";

import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { is_test_env } from "@storiny/shared/src/utils/is-test-env";
import { use_blog_context } from "@storiny/web/src/common/context/blog";
import clsx from "clsx";
import { usePathname as use_pathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import React from "react";

import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { forward_ref } from "~/utils/forward-ref";

import menu_item_styles from "../common/menu-item.module.scss";
import right_slot_styles from "../common/right-slot.module.scss";
import { MenuItemProps } from "./menu-item.props";

const MenuItem = forward_ref<MenuItemProps, "div">((props, ref) => {
  const {
    as = "div",
    className,
    decorator,
    right_slot,
    slot_props,
    children,
    check_auth,
    onClick: on_click,
    onSelect: on_select,
    ...rest
  } = props;
  const pathname = use_pathname();
  const logged_in = use_app_selector(select_is_logged_in);
  const blog = use_blog_context();
  const should_login = check_auth && !logged_in;
  const Component = should_login ? "a" : as;
  const to =
    typeof (rest as any)?.href === "string"
      ? `?to=${encodeURIComponent((rest as any).href)}`
      : pathname && pathname !== "/"
        ? `?to=${encodeURIComponent(
            `${blog?.id ? `${get_blog_url(blog)}` : ""}${pathname}`
          )}`
        : "";

  /**
   * Handles click event
   * @param event Click event
   */
  const handle_click = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (should_login) {
      if (is_test_env()) {
        event.preventDefault(); // Prevent navigation when testing
      }
    } else {
      on_click?.(event);
    }
  };

  /**
   * Handles select event
   * @param event Select event
   */
  const handle_select = (event: Event): void => {
    if (should_login) {
      if (is_test_env()) {
        event.preventDefault(); // Prevent navigation when testing
      }
    } else {
      on_select?.(event);
    }
  };

  return (
    <DropdownMenu.Item
      {...rest}
      asChild
      className={clsx(menu_item_styles.item, className)}
      onClick={handle_click}
      onSelect={handle_select}
      ref={ref}
      {...(should_login ? { href: `/login${to}` } : {})}
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
    </DropdownMenu.Item>
  );
});

MenuItem.displayName = "MenuItem";

export const MenuItemUnstyled = DropdownMenu.Item;
export default MenuItem;
