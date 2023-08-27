import {
  DropdownMenuCheckboxItemProps,
  DropdownMenuItemIndicatorProps
} from "@radix-ui/react-dropdown-menu";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenuCheckboxItemPrimitive = DropdownMenuCheckboxItemProps &
  PolymorphicProps<"div">;

export interface MenuCheckboxItemProps extends MenuCheckboxItemPrimitive {
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
    indicator?: DropdownMenuItemIndicatorProps;
    rightSlot?: React.ComponentPropsWithoutRef<"span">;
  };
}
