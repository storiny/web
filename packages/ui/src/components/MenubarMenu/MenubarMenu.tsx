"use client";

import { Arrow, Content, Menu, Portal, Trigger } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import menuStyles from "../common/Menu.module.scss";
import { MenubarMenuProps } from "./MenubarMenu.props";

const MenubarMenu = forwardRef<MenubarMenuProps, "div">((props, ref) => {
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
          collisionPadding={8}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(menuStyles.content, menuStyles.md, className)}
          ref={ref}
        >
          <Component>
            {children}
            <Arrow
              {...slot_props?.arrow}
              className={clsx(menuStyles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </Content>
      </Portal>
    </Menu>
  );
});

MenubarMenu.displayName = "MenubarMenu";

export default MenubarMenu;
