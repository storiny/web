import { atomWithReset as atom_with_reset } from "jotai/utils";

import { GallerySidebarTabsValue } from "../sidebar-tab";

export type NavSegmentValue =
  | Exclude<GallerySidebarTabsValue, "whiteboard">
  | "home";

export const nav_segment_atom = atom_with_reset<NavSegmentValue>("home");
