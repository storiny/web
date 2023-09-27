import { DropdownMenuItemProps } from "@radix-ui/react-dropdown-menu";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenuItemPrimitive = DropdownMenuItemProps & PolymorphicProps<"div">;

export interface MenuItemProps extends MenuItemPrimitive {
  /**
   * The authentication flag to redirect the user to the login page if they are logged out.
   * @default false
   */
  checkAuth?: boolean;
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
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    rightSlot?: React.ComponentPropsWithoutRef<"span">;
  };
}
