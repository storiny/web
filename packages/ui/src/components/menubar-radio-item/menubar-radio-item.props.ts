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
