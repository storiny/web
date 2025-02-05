import { Menubar } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarSubPrimitive = Menubar.MenubarSubProps & PolymorphicProps<"div">;

export interface MenubarSubProps extends MenubarSubPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    content?: Menubar.MenubarSubContentProps;
    portal?: Menubar.MenubarPortalProps;
    trigger?: Menubar.MenubarSubTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
