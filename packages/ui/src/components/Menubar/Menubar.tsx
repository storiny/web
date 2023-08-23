"use client";

import { Root } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import { MenubarProps } from "./Menubar.props";

const Menubar = forwardRef<MenubarProps, "div">((props, ref) => {
  const { as: Component = "div", className, children, ...rest } = props;
  return (
    <Root {...rest} asChild className={clsx("flex", className)} ref={ref}>
      <Component>{children}</Component>
    </Root>
  );
});

Menubar.displayName = "Menubar";

export default Menubar;
