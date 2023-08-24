"use client";

import { RadioGroup } from "@radix-ui/react-menubar";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import { MenubarRadioGroupProps } from "./MenubarRadioGroup.props";

const MenubarRadioGroup = forwardRef<MenubarRadioGroupProps, "div">(
  (props, ref) => {
    const { as: Component = "div", children, ...rest } = props;
    return (
      <RadioGroup {...rest} asChild ref={ref}>
        <Component>{children}</Component>
      </RadioGroup>
    );
  }
);

MenubarRadioGroup.displayName = "MenubarRadioGroup";

export default MenubarRadioGroup;
