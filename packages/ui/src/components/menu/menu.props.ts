import {
  DropdownMenuArrowProps,
  DropdownMenuContentProps,
  DropdownMenuPortalProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps
} from "@radix-ui/react-dropdown-menu";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type MenuSize = "md" | "sm";

type MenuPrimitive = DropdownMenuProps & PolymorphicProps<"div">;

export interface MenuProps extends MenuPrimitive {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: MenuSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: DropdownMenuArrowProps;
    content?: DropdownMenuContentProps;
    portal?: DropdownMenuPortalProps;
    trigger?: DropdownMenuTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
