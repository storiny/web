import React from "react";

export interface SidenavProps extends React.ComponentPropsWithoutRef<"aside"> {
  /**
   * Force the component to render, ignoring the tablet breakpoint.
   * @default false
   */
  forceMount?: boolean;
}
