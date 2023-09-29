import { TabsProps as TabsPrimitiveProps } from "@radix-ui/react-tabs";

import { PolymorphicProps } from "~/types/index";

export type TabsOrientation = "horizontal" | "vertical";

type TabsPrimitive = TabsPrimitiveProps & PolymorphicProps<"div">;

export interface TabsProps extends TabsPrimitive {
  /**
   * The orientation of the component.
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
}
