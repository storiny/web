import { atomWithReset } from "jotai/utils";

import { GallerySidebarTabsValue } from "../sidebar-tab";

export type NavSegmentValue =
  | Exclude<GallerySidebarTabsValue, "whiteboard">
  | "home";

export const navSegmentAtom = atomWithReset<NavSegmentValue>("home");
