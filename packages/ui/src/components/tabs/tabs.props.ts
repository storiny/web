import { Tabs } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

export type TabsOrientation = "horizontal" | "vertical";

type TabsPrimitive = Tabs.TabsProps & PolymorphicProps<"div">;

export interface TabsProps extends TabsPrimitive {
  /**
   * The orientation of the component.
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
}
