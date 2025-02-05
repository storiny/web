import { Tabs } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

type TabPanelPrimitive = Tabs.TabsContentProps & PolymorphicProps<"div">;

export type TabPanelProps = TabPanelPrimitive;
