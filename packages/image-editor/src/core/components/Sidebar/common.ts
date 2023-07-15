import React from "react";

import { AppState, SidebarName, SidebarTabName } from "../../types";

export type SidebarTriggerProps = {
  children?: React.ReactNode;
  className?: string;
  icon?: JSX.Layer;
  name: SidebarName;
  onToggle?: (open: boolean) => void;
  style?: React.CSSProperties;
  tab?: SidebarTabName;
  title?: string;
};

export type SidebarProps<P = {}> = {
  // NOTE sidebars we use internally inside the editor must have this flag set.
  // It indicates that this sidebar should have lower precedence over host
  // sidebars, if both are open.
  /** @private internal */
  __fallback?: boolean;
  children: React.ReactNode;
  className?: string;
  docked?: boolean;
  name: SidebarName;
  /**
   * supply alongside `docked` prop in order to make the Sidebar user-dockable
   */
  onDock?: (docked: boolean) => void;
  /**
   * Called on sidebar open/close or tab change.
   */
  onStateChange?: (state: AppState["openSidebar"]) => void;
} & P;

export type SidebarPropsContextValue = Pick<
  SidebarProps,
  "onDock" | "docked"
> & { onCloseRequest: () => void; shouldRenderDockButton: boolean };

export const SidebarPropsContext =
  React.createContext<SidebarPropsContextValue>({} as SidebarPropsContextValue);
