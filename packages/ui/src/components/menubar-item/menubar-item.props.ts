import { MenubarItemProps as MenubarItemPrimitiveProps } from "@radix-ui/react-menubar";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarItemPrimitive = MenubarItemPrimitiveProps & PolymorphicProps<"div">;

export interface MenubarItemProps extends MenubarItemPrimitive {
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
    right_slot?: React.ComponentPropsWithoutRef<"span">;
  };
}
