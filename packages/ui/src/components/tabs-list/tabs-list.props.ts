import { Tabs } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

export type TabsListSize = "lg" | "md";

type TabsListPrimitive = Tabs.TabsListProps & PolymorphicProps<"div">;

export interface TabsListProps extends TabsListPrimitive {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: TabsListSize;
}
