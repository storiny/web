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
  right_slot?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    indicator?: DropdownMenuItemIndicatorProps;
    right_slot?: React.ComponentPropsWithoutRef<"span">;
  };
}
