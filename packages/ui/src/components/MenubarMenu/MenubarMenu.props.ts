import {
  MenubarArrowProps,
  MenubarContentProps,
  MenubarMenuProps as MenubarMenuPrimitiveProps,
  MenubarPortalProps,
  MenubarTriggerProps
} from "@radix-ui/react-menubar";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarPrimitive = MenubarMenuPrimitiveProps & PolymorphicProps<"div">;

export interface MenubarMenuProps extends MenubarPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    arrow?: MenubarArrowProps;
    content?: MenubarContentProps;
    portal?: MenubarPortalProps;
    trigger?: MenubarTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
