"use client";

import clsx from "clsx";
import { Menubar as MenubarPrimitive } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import { MenubarProps } from "./menubar.props";

const Menubar = forward_ref<MenubarProps, "div">((props, ref) => {
  const { as: Component = "div", className, children, ...rest } = props;
  return (
    <MenubarPrimitive.Root
      {...rest}
      asChild
      className={clsx(css["flex"], className)}
      ref={ref}
    >
      <Component>{children}</Component>
    </MenubarPrimitive.Root>
  );
});

Menubar.displayName = "Menubar";

export default Menubar;
