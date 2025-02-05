import { Tabs } from "radix-ui";
import React from "react";

type ModalSidebarItemPrimitive = Tabs.TabsTriggerProps &
  React.ComponentPropsWithRef<"button">;

export interface ModalSidebarItemProps extends ModalSidebarItemPrimitive {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
