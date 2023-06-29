import React from "react";

export interface LeftSidebarProps
  extends React.ComponentPropsWithoutRef<"aside"> {
  /**
   * The props passed to the individual layout components.
   */
  componentProps?: { wrapper?: React.ComponentPropsWithoutRef<"div"> };
  /**
   * Force the component to render, ignoring the desktop breakpoint.
   * @default false
   */
  forceMount?: boolean;
}
