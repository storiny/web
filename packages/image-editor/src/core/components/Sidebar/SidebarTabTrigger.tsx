import * as RadixTabs from "@radix-ui/react-tabs";

import { SidebarTabName } from "../../types";

export const SidebarTabTrigger = ({
  children,
  tab,
  onSelect,
  ...rest
}: {
  children: React.ReactNode;
  onSelect?: React.ReactEventHandler<HTMLButtonLayer> | undefined;
  tab: SidebarTabName;
} & Omit<React.HTMLAttributes<HTMLButtonLayer>, "onSelect">) => (
  <RadixTabs.Trigger asChild onSelect={onSelect} value={tab}>
    <button
      className={`excalidraw-button sidebar-tab-trigger`}
      type={"button"}
      {...rest}
    >
      {children}
    </button>
  </RadixTabs.Trigger>
);
SidebarTabTrigger.displayName = "SidebarTabTrigger";
