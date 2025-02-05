"use client";

import { Menubar } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import { MenubarRadioGroupProps } from "./menubar-radio-group.props";

const MenubarRadioGroup = forward_ref<MenubarRadioGroupProps, "div">(
  (props, ref) => {
    const { as: Component = "div", children, ...rest } = props;
    return (
      <Menubar.RadioGroup {...rest} asChild ref={ref}>
        <Component>{children}</Component>
      </Menubar.RadioGroup>
    );
  }
);

MenubarRadioGroup.displayName = "MenubarRadioGroup";

export default MenubarRadioGroup;
