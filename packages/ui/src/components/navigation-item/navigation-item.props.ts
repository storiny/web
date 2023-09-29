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
  end_decorator?: React.ReactNode;
  /**
   * The props passed to the individual component elements
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    end_decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
