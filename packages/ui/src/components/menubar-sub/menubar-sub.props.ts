import {
  MenubarPortalProps,
  MenubarSubContentProps,
  MenubarSubProps as MenubarSubPrimitiveProps,
  MenubarSubTriggerProps
} from "@radix-ui/react-menubar";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type MenubarSubPrimitive = MenubarSubPrimitiveProps & PolymorphicProps<"div">;

export interface MenubarSubProps extends MenubarSubPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    content?: MenubarSubContentProps;
    portal?: MenubarPortalProps;
    trigger?: MenubarSubTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
