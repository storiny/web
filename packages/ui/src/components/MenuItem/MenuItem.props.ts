import { DropdownMenuItemProps } from "@radix-ui/react-dropdown-menu";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenuItemPrimitive = DropdownMenuItemProps & PolymorphicProps<"div">;

export interface MenuItemProps extends MenuItemPrimitive {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The element placed after the children.
   */
  rightSlot?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    rightSlot?: React.ComponentPropsWithoutRef<"span">;
  };
}
