import * as RadixTabs from "@radix-ui/react-tabs";

import { useUIAppState } from "../../context/ui-editorState";
import { useExcalidrawSetAppState } from "../App";

export const SidebarTabs = ({
  children,
  ...rest
}: {
  children: React.ReactNode;
} & Omit<React.RefAttributes<HTMLDivLayer>, "onSelect">) => {
  const editorState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();

  if (!editorState.openSidebar) {
    return null;
  }

  const { name } = editorState.openSidebar;

  return (
    <RadixTabs.Root
      className="sidebar-tabs-root"
      onValueChange={(tab) =>
        setAppState((state) => ({
          ...state,
          openSidebar: { ...state.openSidebar, name, tab }
        }))
      }
      value={editorState.openSidebar.tab}
      {...rest}
    >
      {children}
    </RadixTabs.Root>
  );
};
SidebarTabs.displayName = "SidebarTabs";
