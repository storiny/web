import { atom } from "jotai";

import { GallerySidebarTabsValue } from "../sidebar-tab";

export type NavSegmentValue =
  | Exclude<GallerySidebarTabsValue, "whiteboard">
  | "home";

export const navSegmentAtom = atom<NavSegmentValue>("home");
