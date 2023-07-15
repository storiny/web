import * as RadixTabs from "@radix-ui/react-tabs";

import { SidebarTabName } from "../../types";

export const SidebarTab = ({
  tab,
  children,
  ...rest
}: {
  children: React.ReactNode;
  tab: SidebarTabName;
} & React.HTMLAttributes<HTMLDivLayer>) => (
  <RadixTabs.Content {...rest} value={tab}>
    {children}
  </RadixTabs.Content>
);
SidebarTab.displayName = "SidebarTab";
