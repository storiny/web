import { TabsTriggerProps } from "@radix-ui/react-tabs";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type TabSize = "lg" | "md";

type TabPrimitive = TabsTriggerProps & PolymorphicProps<"button">;

export interface TabProps extends TabPrimitive {
  /**
   * The element placed before the children if they are
   * present, render with a decorator only tab otherwise.
   */
  decorator?: React.ReactNode;
  /**
   * The size of the component. Overrides the size
   * inferred from the context.
   */
  size?: TabSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
