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
  rightSlot?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    rightSlot?: React.ComponentPropsWithoutRef<"span">;
  };
}
