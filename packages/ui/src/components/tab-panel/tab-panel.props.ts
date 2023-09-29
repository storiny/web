import { TabsContentProps } from "@radix-ui/react-tabs";

import { PolymorphicProps } from "~/types/index";

type TabPanelPrimitive = TabsContentProps & PolymorphicProps<"div">;

export type TabPanelProps = TabPanelPrimitive;
