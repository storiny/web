"use client";

import clsx from "clsx";
import { DropdownMenu } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import menu_styles from "../common/menu.module.scss";
import { MenuProps } from "./menu.props";

const Menu = forward_ref<MenuProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    size = "md",
    slot_props,
    ...rest
  } = props;

  return (
    <DropdownMenu.Root modal={false} {...rest}>
      <DropdownMenu.Trigger {...slot_props?.trigger} asChild>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal {...slot_props?.portal}>
        <DropdownMenu.Content
          collisionPadding={12}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(menu_styles.content, menu_styles[size], className)}
          ref={ref}
        >
          <Component>
            {children}
            <DropdownMenu.Arrow
              {...slot_props?.arrow}
              className={clsx(menu_styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
});

Menu.displayName = "Menu";

export default Menu;
