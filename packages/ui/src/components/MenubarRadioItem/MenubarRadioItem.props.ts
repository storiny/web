import {
  MenubarItemIndicatorProps,
  MenubarRadioItemProps as MenubarRadioItemPrimitiveProps
} from "@radix-ui/react-menubar";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarRadioItemPrimitive = MenubarRadioItemPrimitiveProps &
  PolymorphicProps<"div">;

export interface MenubarRadioItemProps extends MenubarRadioItemPrimitive {
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
