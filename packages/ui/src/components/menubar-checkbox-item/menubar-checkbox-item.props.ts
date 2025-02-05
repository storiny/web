import { Menubar } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarCheckboxItemPrimitive = Menubar.MenubarCheckboxItemProps &
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
    indicator?: Menubar.MenubarItemIndicatorProps;
    right_slot?: React.ComponentPropsWithoutRef<"span">;
  };
}
