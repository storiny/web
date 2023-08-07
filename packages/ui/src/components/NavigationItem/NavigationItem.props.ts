import React from "react";

export interface NavigationItemProps
  extends React.ComponentPropsWithRef<"button"> {
  /**
   * The element placed before the children
   */
  decorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
