import React from "react";

import { PolymorphicProps } from "~/types/polymorphic";

export interface NavigationItemProps extends PolymorphicProps<"button"> {
  /**
   * The element placed before the children
   */
  decorator?: React.ReactNode;
  /**
   * The element placed after the children
   */
  endDecorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    endDecorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
