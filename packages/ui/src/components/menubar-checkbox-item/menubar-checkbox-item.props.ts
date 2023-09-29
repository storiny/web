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
  right_slot?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    indicator?: MenubarItemIndicatorProps;
    right_slot?: React.ComponentPropsWithoutRef<"span">;
  };
}
