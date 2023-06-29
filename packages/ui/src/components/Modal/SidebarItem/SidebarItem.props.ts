import { TabsTriggerProps } from "@radix-ui/react-tabs";
import React from "react";

type ModalSidebarItemPrimitive = TabsTriggerProps &
  React.ComponentPropsWithRef<"button">;

export interface ModalSidebarItemProps extends ModalSidebarItemPrimitive {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
