import { TabsListProps as TabsListPrimitiveProps } from "@radix-ui/react-tabs";

import { PolymorphicProps } from "~/types/index";

export type TabsListSize = "lg" | "md";

type TabsListPrimitive = TabsListPrimitiveProps & PolymorphicProps<"div">;

export interface TabsListProps extends TabsListPrimitive {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: TabsListSize;
}
