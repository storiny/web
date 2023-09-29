import React from "react";

export interface BottomNavigationProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Force the component to render, ignoring the mobile breakpoint and logged in state.
   * @default false
   */
  force_mount?: boolean;
}
