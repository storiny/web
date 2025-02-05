"use client";

import clsx from "clsx";
import { Menubar } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import menu_styles from "../common/menu.module.scss";
import { MenubarMenuProps } from "./menubar-menu.props";

const MenubarMenu = forward_ref<MenubarMenuProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    slot_props,
    ...rest
  } = props;

  return (
    <Menubar.Menu {...rest}>
      <Menubar.Trigger {...slot_props?.trigger} asChild>
        {trigger}
      </Menubar.Trigger>
      <Menubar.Portal {...slot_props?.portal}>
        <Menubar.Content
          collisionPadding={12}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(menu_styles.content, menu_styles.md, className)}
          ref={ref}
        >
          <Component>
            {children}
            <Menubar.Arrow
              {...slot_props?.arrow}
              className={clsx(menu_styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  );
});

MenubarMenu.displayName = "MenubarMenu";

export default MenubarMenu;
