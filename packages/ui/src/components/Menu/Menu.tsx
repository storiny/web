"use client";

import {
  Arrow,
  Content,
  Portal,
  Root,
  Trigger
} from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import menuStyles from "../common/Menu.module.scss";
import { MenuProps } from "./Menu.props";

const Menu = forwardRef<MenuProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    size = "md",
    slotProps,
    ...rest
  } = props;

  return (
    <Root modal={false} {...rest}>
      <Trigger {...slotProps?.trigger} asChild>
        {trigger}
      </Trigger>
      <Portal {...slotProps?.portal}>
        <Content
          collisionPadding={8}
          sideOffset={5}
          {...slotProps?.content}
          asChild
          className={clsx(menuStyles.content, menuStyles[size], className)}
          ref={ref}
        >
          <Component>
            {children}
            <Arrow
              {...slotProps?.arrow}
              className={clsx(menuStyles.arrow, slotProps?.arrow?.className)}
            />
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

Menu.displayName = "Menu";

export default Menu;
