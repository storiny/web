import {
  MenubarCheckboxItemProps as MenubarCheckboxItemPrimitiveProps,
  MenubarItemIndicatorProps
} from "@radix-ui/react-menubar";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarCheckboxItemPrimitive = MenubarCheckboxItemPrimitiveProps &
  PolymorphicProps<"div">;

export interface MenubarCheckboxItemProps extends MenubarCheckboxItemPrimitive {
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
    indicator?: MenubarItemIndicatorProps;
    rightSlot?: React.ComponentPropsWithoutRef<"span">;
  };
}
