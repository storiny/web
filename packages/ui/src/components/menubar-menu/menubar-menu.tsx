"use client";

import { Arrow, Content, Menu, Portal, Trigger } from "@radix-ui/react-menubar";
import clsx from "clsx";
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
    <Menu {...rest}>
      <Trigger {...slot_props?.trigger} asChild>
        {trigger}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Content
          collisionPadding={12}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(menu_styles.content, menu_styles.md, className)}
          ref={ref}
        >
          <Component>
            {children}
            <Arrow
              {...slot_props?.arrow}
              className={clsx(menu_styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </Content>
      </Portal>
    </Menu>
  );
});

MenubarMenu.displayName = "MenubarMenu";

export default MenubarMenu;
