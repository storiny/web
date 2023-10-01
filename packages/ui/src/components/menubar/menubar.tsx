"use client";

import { Root } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import { MenubarProps } from "./menubar.props";

const Menubar = forward_ref<MenubarProps, "div">((props, ref) => {
  const { as: Component = "div", className, children, ...rest } = props;
  return (
    <Root {...rest} asChild className={clsx(css["flex"], className)} ref={ref}>
      <Component>{children}</Component>
    </Root>
  );
});

Menubar.displayName = "Menubar";

export default Menubar;
