import React from "react";

export interface LeftSidebarProps
  extends React.ComponentPropsWithoutRef<"aside"> {
  /**
   * The props passed to the individual layout components.
   */
  component_props?: { wrapper?: React.ComponentPropsWithoutRef<"div"> };
  /**
   * Force the component to render, ignoring the desktop breakpoint.
   * @default false
   */
  force_mount?: boolean;
}
