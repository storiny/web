import { DropdownMenu } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type MenuSize = "md" | "sm";

type MenuPrimitive = DropdownMenu.DropdownMenuProps & PolymorphicProps<"div">;

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
    arrow?: DropdownMenu.DropdownMenuArrowProps;
    content?: DropdownMenu.DropdownMenuContentProps;
    portal?: DropdownMenu.DropdownMenuPortalProps;
    trigger?: DropdownMenu.DropdownMenuTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
