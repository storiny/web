import { Menubar } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarMenuPrimitive = Menubar.MenubarMenuProps & PolymorphicProps<"div">;

export interface MenubarMenuProps extends MenubarMenuPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: Menubar.MenubarArrowProps;
    content?: Menubar.MenubarContentProps;
    portal?: Menubar.MenubarPortalProps;
    trigger?: Menubar.MenubarTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
