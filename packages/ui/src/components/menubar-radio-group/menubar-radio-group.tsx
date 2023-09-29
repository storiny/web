"use client";

import { RadioGroup } from "@radix-ui/react-menubar";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";

import { MenubarRadioGroupProps } from "./menubar-radio-group.props";

const MenubarRadioGroup = forward_ref<MenubarRadioGroupProps, "div">(
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
